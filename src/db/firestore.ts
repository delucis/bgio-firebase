import admin from 'firebase-admin';
import { Async } from 'boardgame.io/internal';
import { LogEntry, Server, State, StorageAPI } from 'boardgame.io';
import { DB_PREFIX, tables, DBTable, FirebaseDBOpts } from './shared';

export class Firestore extends Async {
  client: typeof admin;
  db: admin.firestore.Firestore;
  metadata: admin.firestore.CollectionReference;
  state: admin.firestore.CollectionReference;
  initialState: admin.firestore.CollectionReference;
  log: admin.firestore.CollectionReference;

  constructor({ app, config, dbPrefix = DB_PREFIX }: FirebaseDBOpts = {}) {
    super();
    this.client = admin;
    const hasNoInitializedApp = this.client.apps.length === 0;
    const isNamedAppUninitialized =
      app && !this.client.apps.some((a) => a && a.name === app);
    if (hasNoInitializedApp || isNamedAppUninitialized) {
      this.client.initializeApp(config, app);
    }
    this.db = this.client.app(app).firestore();
    this.metadata = this.db.collection(dbPrefix + DBTable.Metadata);
    this.state = this.db.collection(dbPrefix + DBTable.State);
    this.initialState = this.db.collection(dbPrefix + DBTable.InitialState);
    this.log = this.db.collection(dbPrefix + DBTable.Log);
  }

  async connect(): Promise<void> {
    // TODO: connect to db
  }

  async createGame(
    gameID: string,
    opts: StorageAPI.CreateGameOpts
  ): Promise<void> {
    return this.db.runTransaction(async (transaction) => {
      transaction
        .set(this.metadata.doc(gameID), opts.metadata)
        .set(this.state.doc(gameID), opts.initialState)
        .set(this.initialState.doc(gameID), opts.initialState)
        .set(this.log.doc(gameID), { log: [] });
    });
  }

  async setState(
    gameID: string,
    state: State,
    deltalog?: LogEntry[]
  ): Promise<void> {
    return this.db.runTransaction(async (transaction) => {
      const stateRef = this.state.doc(gameID);
      // read previous state from the database
      const prevSnapshot = await transaction.get(stateRef);
      const prevState = prevSnapshot.data() as State | undefined;

      // don’t set if database state is newer
      if (!prevState || prevState._stateID < state._stateID) {
        transaction.set(this.state.doc(gameID), state);

        // concatenate log if deltalog is provided
        if (deltalog && deltalog.length > 0) {
          transaction.set(this.log.doc(gameID), {
            log: this.client.firestore.FieldValue.arrayUnion(...deltalog),
          });
        }
      }
    });
  }

  async setMetadata(
    gameID: string,
    metadata: Server.GameMetadata
  ): Promise<void> {
    await this.metadata.doc(gameID).set(metadata);
  }

  async fetch<O extends StorageAPI.FetchOpts>(
    gameID: string,
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
          .get(this[table].doc(gameID))
          .then((snapshot) => {
            // Read returned data
            const data = snapshot.data() as State & {
              log: LogEntry[];
            } & Server.GameMetadata;
            // Add data to the results map
            if (table === DBTable.Log) {
              // Handle log storage format to return array
              result[table] = data ? data.log : data;
            } else {
              result[table] = data;
            }
          });
        requests.push(fetch);
      }

      await Promise.all(requests);
      return result;
    });
  }

  async wipe(gameID: string): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      transaction
        .delete(this.metadata.doc(gameID))
        .delete(this.state.doc(gameID))
        .delete(this.initialState.doc(gameID))
        .delete(this.log.doc(gameID));
    });
  }

  async listGames(opts?: StorageAPI.ListGamesOpts): Promise<string[]> {
    const ref =
      opts && opts.gameName
        ? this.metadata.where('gameName', '==', opts.gameName)
        : this.metadata;
    const docs = await ref.get();
    const ids: string[] = [];
    docs.forEach((doc) => ids.push(doc.id));
    return ids;
  }
}
