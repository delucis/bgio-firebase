import Firebase from 'firebase-admin';
import { FirebaseDB } from './base';

type State = any;

export class RTDB extends FirebaseDB {
  db!: Firebase.database.Reference;

  constructor(opts: { dbname: string }) {
    super(opts);
  }

  async connect(client: typeof Firebase): Promise<void> {
    this.db = client.database().ref();
  }

  async set(gameID: string, state: State): Promise<void> {
    const ref = this.db.child(gameID);
    await ref.set(state);
  }

  async get(gameID: string): Promise<State | undefined> {
    const ref = this.db.child(gameID);
    const snapshot = await ref.once('value');
    const data = snapshot.val();
    return data === null ? undefined : data;
  }

  async has(gameID: string): Promise<boolean> {
    const ref = this.db.child(gameID);
    const snapshot = await ref.once('value');
    return snapshot.exists();
  }

  async remove(gameID: string): Promise<void> {
    const ref = this.db.child(gameID);
    await ref.remove();
  }

  async list(): Promise<string[]> {
    const snapshot = await this.db.once('value');
    const gameIDs: string[] = [];
    snapshot.forEach(({ key }) => {
      if (key) gameIDs.push(key);
    });
    return gameIDs;
  }
}
