import Firebase from 'firebase-admin';
import { FirebaseDB } from './base';

type State = any;

export class Firestore extends FirebaseDB {
  db!: FirebaseFirestore.Firestore;

  constructor(opts: { dbname: string }) {
    super(opts);
  }

  async connect(client: typeof Firebase): Promise<void> {
    this.db = client.firestore();
  }

  async set(gameID: string, state: State): Promise<void> {
    const ref = this.db.collection(this.dbname).doc(gameID);
    await ref.set(state);
  }

  async get(gameID: string): Promise<State | undefined> {
    const ref = this.db.collection(this.dbname).doc(gameID);
    const snapshot = await ref.get();
    return snapshot.data();
  }

  async has(gameID: string): Promise<boolean> {
    const col = this.db.collection(this.dbname).doc(gameID);
    const snapshot = await col.get();
    return snapshot.exists;
  }

  async remove(gameID: string): Promise<void> {
    const ref = this.db.collection(this.dbname).doc(gameID);
    await ref.delete();
  }

  async list(): Promise<string[]> {
    const docs = await this.db.collection(this.dbname).get();
    const ids: string[] = [];
    docs.forEach(doc => ids.push(doc.id));
    return ids;
  }
}
