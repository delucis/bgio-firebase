/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { FirebaseDB, Engine, FirebaseDBOpts } from './bgio-firebase';
import firebasemock from 'firebase-mock';

async function NewFirebase(args?: FirebaseDBOpts): Promise<FirebaseDB> {
  const mockDatabase = new firebasemock.MockFirebase();
  const mockFirestore = new firebasemock.MockFirestore();

  const mockSDK = new firebasemock.MockFirebaseSdk(
    () => mockDatabase, // use null if your code does not use RTDB
    () => null, // use null if your code does not use AUTHENTICATION
    () => mockFirestore, // use null if your code does not use FIRESTORE
    () => null, // use null if your code does not use STORAGE
    () => null // use null if your code does not use MESSAGING
  );

  const db = new FirebaseDB(args);
  db.client = mockSDK;
  await db.connect();
  if (args?.engine === Engine.RTDB) {
    mockSDK
      .database()
      .ref()
      .autoFlush();
  } else {
    mockSDK.firestore().autoFlush();
  }
  return db;
}

test('construction', () => {
  const dbname = 'a';
  const db = new FirebaseDB({ dbname });
  expect(db.dbname).toBe(dbname);
  expect(db.config).toEqual({});
});

describe('Firestore', () => {
  let db: FirebaseDB;

  beforeEach(async () => {
    db = await NewFirebase();
  });

  test('must return undefined when no game exists', async () => {
    const state = await db.get('gameID');
    expect(state).toBeUndefined();
  });

  test('cache hit', async () => {
    // Create game.
    await db.set('gameID', { a: 1 });

    // Must return created game.
    const state = await db.get('gameID');
    expect(state).toMatchObject({ a: 1 });

    // Must return true if game exists
    const has = await db.has('gameID');
    expect(has).toBe(true);
  });

  test('cache miss', async () => {
    // Create game.
    await db.set('gameID', { a: 1 });

    // Must return created game.
    db.cache.reset();
    const state = await db.get('gameID');
    expect(state).toMatchObject({ a: 1 });

    // Must return true if game exists
    db.cache.reset();
    const has = await db.has('gameID');
    expect(has).toBe(true);
  });

  test('cache size', async () => {
    const db = await NewFirebase({
      cacheSize: 1,
      engine: Engine.FIRESTORE,
    });
    await db.set('gameID', { a: 1 });
    await db.set('another', { b: 1 });
    expect(db.cache.itemCount).toBe(1);
    expect(db.cache.keys()).toEqual(['another']);
  });

  test('race conditions', async () => {
    // Out of order set()'s.
    await db.set('gameID', { _stateID: 1 });
    await db.set('gameID', { _stateID: 0 });
    expect(await db.get('gameID')).toEqual({ _stateID: 1 });

    // Do not override cache on get() if it is fresher than Firebase.
    await db.set('gameID', { _stateID: 0 });
    db.cache.set('gameID', { _stateID: 1 });
    await db.get('gameID');
    expect(db.cache.get('gameID')).toEqual({ _stateID: 1 });

    // Override if it is staler than Firebase.
    await db.set('gameID', { _stateID: 1 });
    db.cache.reset();
    expect(await db.get('gameID')).toMatchObject({ _stateID: 1 });
    expect(db.cache.get('gameID')).toMatchObject({ _stateID: 1 });
  });

  test('list entries', async () => {
    // Insert 3 entries
    await db.set('gameID_0', { a: 0 });
    await db.set('gameID_2', { a: 2 });
    await db.set('gameID_1', { a: 1 });
    const ids = await db.list();
    expect(ids).toContain('gameID_0');
    expect(ids).toContain('gameID_1');
    expect(ids).toContain('gameID_2');
  });

  test('remove entry', async () => {
    // Insert 2 entries
    await db.set('gameID_0', { a: 0 });
    await db.set('gameID_1', { a: 1 });
    // Remove 1
    await db.remove('gameID_1');
    expect(await db.has('gameID_0')).toBe(true);
    expect(await db.has('gameID_1')).toBe(false);
    await db.remove('gameID_1');
  });
});

describe('RTDB', () => {
  let db: FirebaseDB;

  beforeEach(async () => {
    db = await NewFirebase({ engine: Engine.RTDB });
  });

  test('must return undefined when no game exists', async () => {
    const state = await db.get('gameID');
    expect(state).toEqual(undefined);
  });

  test('cache hit', async () => {
    // Create game.
    await db.set('gameID', { a: 1 });

    // Must return created game.
    const state = await db.get('gameID');
    expect(state).toMatchObject({ a: 1 });

    // Must return true if game exists
    const has = await db.has('gameID');
    expect(has).toBe(true);
  });

  test('cache miss', async () => {
    // Create game.
    await db.set('gameID', { a: 1 });

    // Must return created game.
    db.cache.reset();
    const state = await db.get('gameID');
    expect(state).toMatchObject({ a: 1 });

    // Must return true if game exists
    db.cache.reset();
    const has = await db.has('gameID');
    expect(has).toBe(true);
  });

  test('cache size', async () => {
    const db = await NewFirebase({
      cacheSize: 1,
      engine: Engine.RTDB,
    });
    await db.set('gameID', { a: 1 });
    await db.set('another', { b: 1 });
    expect(db.cache.itemCount).toBe(1);
    expect(db.cache.keys()).toEqual(['another']);
  });

  test('race conditions', async () => {
    // Out of order set()'s.
    await db.set('gameID', { _stateID: 1 });
    await db.set('gameID', { _stateID: 0 });
    expect(await db.get('gameID')).toEqual({ _stateID: 1 });

    // Do not override cache on get() if it is fresher than Firebase.
    await db.set('gameID', { _stateID: 0 });
    db.cache.set('gameID', { _stateID: 1 });
    await db.get('gameID');
    expect(db.cache.get('gameID')).toEqual({ _stateID: 1 });

    // Override if it is staler than Firebase.
    await db.set('gameID', { _stateID: 1 });
    db.cache.reset();
    expect(await db.get('gameID')).toMatchObject({ _stateID: 1 });
    expect(db.cache.get('gameID')).toMatchObject({ _stateID: 1 });
  });

  test('list entries', async () => {
    // Insert 3 entries
    await db.set('gameID_0', { a: 0 });
    await db.set('gameID_2', { a: 2 });
    await db.set('gameID_1', { a: 1 });
    const ids = await db.list();
    expect(ids).toContain('gameID_0');
    expect(ids).toContain('gameID_1');
    expect(ids).toContain('gameID_2');
  });

  test('remove entry', async () => {
    // Insert 2 entries
    await db.set('gameID_0', { a: 0 });
    await db.set('gameID_1', { a: 1 });
    // Remove 1
    await db.remove('gameID_1');
    expect(await db.has('gameID_0')).toBe(true);
    expect(await db.has('gameID_1')).toBe(false);
    await db.remove('gameID_1');
  });
});
