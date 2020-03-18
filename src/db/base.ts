import Firebase from 'firebase-admin';

type State = any;

export abstract class FirebaseDB {
  dbname: string;

  constructor(opts: { dbname: string }) {
    this.dbname = opts.dbname;
  }

  abstract connect(client: typeof Firebase): Promise<void>;
  abstract get(gameID: string): Promise<State | undefined>;
  abstract set(gameID: string, state: State): Promise<void>;
  abstract remove(gameID: string): Promise<void>;
  abstract list(): Promise<string[]>;
  abstract has(gameID: string): Promise<boolean>;
}
