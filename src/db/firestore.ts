import admin from 'firebase-admin';
import { Async } from 'boardgame.io/internal';
import { LogEntry, Server, State, StorageAPI } from 'boardgame.io';
import { DB_PREFIX, tables, isTable, DBTable, FirebaseDBOpts } from './shared';

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
    if (
      !this.client.apps?.length ||
      (app && !this.client.apps.some((a) => a?.name === app))
    ) {
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
    const result = {} as StorageAPI.FetchFields;

    // get references for each document to fetch
    const toFetch: admin.firestore.DocumentReference[] = [];
    for (const key of tables) {
      if (opts[key]) toFetch.push(this[key].doc(gameID));
    }

    // bail if there’s nothing to fetch
    if (toFetch.length === 0) return result;

    // fetch required data from database and return result
    const snapshots = await this.db.getAll(...toFetch);
    snapshots.forEach((snap) => {
      const table = snap.ref.parent.id;
      if (isTable(table)) {
        const data = snap.data() as State & {
          log: LogEntry[];
        } & Server.GameMetadata;
        if (table === DBTable.Log) {
          // handle log storage format to return array
          result[table] = data.log;
        } else {
          result[table] = data;
        }
      }
    });
    return result;
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
