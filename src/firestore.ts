import admin from 'firebase-admin';
import { Async } from 'boardgame.io/internal';
import { LogEntry, Server, State, StorageAPI } from 'boardgame.io';
import { DB_PREFIX, tables, DBTable } from './constants';
import {
  extendMatchData,
  standardiseMatchData,
  ExtendedMatchData,
} from './utils';

/**
 * Firestore database class.
 */
export class Firestore extends Async {
  readonly client: typeof admin;
  readonly db: admin.firestore.Firestore;
  readonly useCompositeIndexes: boolean;
  readonly metadata: admin.firestore.CollectionReference;
  readonly state: admin.firestore.CollectionReference;
  readonly initialState: admin.firestore.CollectionReference;
  readonly log: admin.firestore.CollectionReference;

  /**
   * @param app - The name of the Firebase app the connector should use.
   * @param config - A firebase-admin AppOptions configuration object.
   * @param dbPrefix - Prefix for table names (default: 'bgio_').
   * @param ignoreUndefinedProperties - Set to false to disable (default: true).
   * @param useCompositeIndexes - List matches using compound queries (default: false).
   */
  constructor({
    app,
    config,
    dbPrefix = DB_PREFIX,
    ignoreUndefinedProperties = true,
    useCompositeIndexes = false,
  }: {
    app?: string;
    config?: admin.AppOptions;
    dbPrefix?: string;
    ignoreUndefinedProperties?: boolean;
    useCompositeIndexes?: boolean;
  } = {}) {
    super();
    this.client = admin;
    const hasNoInitializedApp = this.client.apps.length === 0;
    const isNamedAppUninitialized =
      app && !this.client.apps.some((a) => a && a.name === app);
    if (hasNoInitializedApp || isNamedAppUninitialized) {
      this.client.initializeApp(config, app);
    }
    this.db = this.client.app(app).firestore();
    if (ignoreUndefinedProperties) {
      this.db.settings({ ignoreUndefinedProperties });
    }
    this.useCompositeIndexes = useCompositeIndexes;
    this.metadata = this.db.collection(dbPrefix + DBTable.Metadata);
    this.state = this.db.collection(dbPrefix + DBTable.State);
    this.initialState = this.db.collection(dbPrefix + DBTable.InitialState);
    this.log = this.db.collection(dbPrefix + DBTable.Log);
  }

  async connect(): Promise<void> {
    // No-op, but required by boardgame.io
  }

  async createMatch(
    matchID: string,
    opts: StorageAPI.CreateMatchOpts
  ): Promise<void> {
    await this.db
      .batch()
      .create(this.metadata.doc(matchID), extendMatchData(opts.metadata))
      .create(this.state.doc(matchID), opts.initialState)
      .create(this.initialState.doc(matchID), opts.initialState)
      .create(this.log.doc(matchID), { log: [] })
      .commit();
  }

  async setState(
    matchID: string,
    state: State,
    deltalog?: LogEntry[]
  ): Promise<void> {
    return this.db.runTransaction(async (transaction) => {
      const stateRef = this.state.doc(matchID);
      // read previous state from the database
      const prevSnapshot = await transaction.get(stateRef);
      const prevState = prevSnapshot.data() as State | undefined;

      // don’t set if database state is newer
      if (!prevState || prevState._stateID < state._stateID) {
        transaction.set(this.state.doc(matchID), state);

        // concatenate log if deltalog is provided
        if (deltalog && deltalog.length > 0) {
          transaction.update(this.log.doc(matchID), {
            log: this.client.firestore.FieldValue.arrayUnion(...deltalog),
          });
        }
      }
    });
  }

  async setMetadata(
    matchID: string,
    metadata: Server.MatchData
  ): Promise<void> {
    const extendedMatchData = extendMatchData(metadata);
    await this.metadata.doc(matchID).set(extendedMatchData);
  }

  async fetch<O extends StorageAPI.FetchOpts>(
    matchID: string,
    opts: O
  ): Promise<StorageAPI.FetchResult<O>> {
    return this.db.runTransaction(async (transaction) => {
      const result = {} as StorageAPI.FetchFields;
      const requests: Promise<void>[] = [];

      // Check if each fetch field is included in the options object
      // and if so, launch a get request for its data.
      for (const table of tables) {
        if (!opts[table]) continue;
        // Launch get request for this document type
        const fetch = transaction
          .get(this[table].doc(matchID))
          .then((snapshot) => {
            // Read returned data
            const data = snapshot.data() as
              | undefined
              | (State & {
                  log: LogEntry[];
                } & ExtendedMatchData);
            // Add data to the results map
            if (data) {
              if (table === DBTable.Log) {
                // Handle log storage format to return array
                result[table] = data.log;
              } else if (table === DBTable.Metadata) {
                // Strip bgio-firebase fields from metadata.
                result[table] = standardiseMatchData(data);
              } else {
                result[table] = data;
              }
            }
          });
        requests.push(fetch);
      }

      await Promise.all(requests);
      return result;
    });
  }

  async wipe(matchID: string): Promise<void> {
    await this.db
      .batch()
      .delete(this.metadata.doc(matchID))
      .delete(this.state.doc(matchID))
      .delete(this.initialState.doc(matchID))
      .delete(this.log.doc(matchID))
      .commit();
  }

  async listMatches({
    gameName,
    where = {},
  }: StorageAPI.ListMatchesOpts = {}): Promise<string[]> {
    let ref: admin.firestore.Query = this.metadata;

    // Filter by updatedAt time if requested.
    let hasDateFilter = false;
    if (where.updatedAfter !== undefined) {
      hasDateFilter = true;
      ref = ref.where('updatedAt', '>', where.updatedAfter);
    }
    if (where.updatedBefore !== undefined) {
      hasDateFilter = true;
      ref = ref.where('updatedAt', '<', where.updatedBefore);
    }

    // Only add equality queries if no range query is present or composite
    // indexes are enabled.
    const needsEqualityQueries =
      gameName !== undefined || where.isGameover !== undefined;
    const canUseEqualityQueries = this.useCompositeIndexes || !hasDateFilter;
    if (needsEqualityQueries && canUseEqualityQueries) {
      // Filter by game name.
      if (gameName !== undefined) ref = ref.where('gameName', '==', gameName);
      // Filter by gameover state.
      if (where.isGameover === true) {
        ref = ref.where('isGameover', '==', true);
      } else if (where.isGameover === false) {
        ref = ref.where('isGameover', '==', false);
      }
    }

    const docs = await ref.get();
    const ids: string[] = [];
    const needsManualFiltering = needsEqualityQueries && !canUseEqualityQueries;
    docs.forEach((doc) => {
      if (needsManualFiltering) {
        const data = doc.data() as ExtendedMatchData;
        if (
          (gameName !== undefined && data.gameName !== gameName) ||
          (where.isGameover === false && data.isGameover !== false) ||
          (where.isGameover === true && data.isGameover !== true)
        ) {
          return;
        }
      }
      ids.push(doc.id);
    });
    return ids;
  }
}
