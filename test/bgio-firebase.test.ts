/*
 * Copyright 2017–20 Chris Swithinbank & the boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import firebase from '@firebase/testing';
import { Server, State } from 'boardgame.io';
import { tables } from '../src/db/shared';
import { Firestore } from '../src/bgio-firebase';


describe('Firestore', () => {
  let db: Firestore;

  // instantiate new database instance for each test
  beforeEach(async () => {
    db = new Firestore();
    await db.connect();
  });

  // clean database after each test
  afterEach(async () => {
    const ids = await db.listGames();
    await Promise.all(ids.map((id) => db.wipe(id)));
  });

  afterAll(async () => {
    // close connections to emulator after testing
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  test('construction', () => {
    const dbPrefix = 'a';
    db = new Firestore({ dbPrefix });
    for (const table of tables) {
      const ref = db[table];
      expect(ref.id).toBe(dbPrefix + table);
    }
  });

  test('must return undefined when no game exists', async () => {
    const data = await db.fetch('gameID', { state: true });
    expect(data.state).toBeUndefined();
  });

  test('fetch', async () => {
    // Create game.
    const initialState = ({ G: 'G', ctx: 'ctx' } as unknown) as State;
    const metadata = { gameName: 'A' } as Server.GameMetadata;
    await db.createGame('gameID', { initialState, metadata });

    // Must return created game.
    const data = await db.fetch('gameID', {
      state: true,
      metadata: true,
      initialState: true,
      log: true,
    });
    expect(data.state).toEqual(initialState);
    expect(data.initialState).toEqual(initialState);
    expect(data.metadata).toEqual(metadata);
    expect(data.log).toEqual([]);
  });

  test('list all entries', async () => {
    // Insert 3 entries
    await db.setMetadata('gameID_0', { gameName: 'A' } as Server.GameMetadata);
    await db.setMetadata('gameID_2', { gameName: 'A' } as Server.GameMetadata);
    await db.setMetadata('gameID_1', { gameName: 'B' } as Server.GameMetadata);
    const ids = await db.listGames();
    expect(ids).toContain('gameID_0');
    expect(ids).toContain('gameID_1');
    expect(ids).toContain('gameID_2');
  });

  test('list entries for specific gameName', async () => {
    await db.setMetadata('gameID_0', { gameName: 'A' } as Server.GameMetadata);
    await db.setMetadata('gameID_2', { gameName: 'A' } as Server.GameMetadata);
    await db.setMetadata('gameID_1', { gameName: 'B' } as Server.GameMetadata);
    const ids = await db.listGames({ gameName: 'A' });
    expect(ids).toContain('gameID_0');
    expect(ids).toContain('gameID_2');
    expect(ids).not.toContain('gameID_1');
  });

  test('remove entry', async () => {
    const initialState = ({ G: 'G', ctx: 'ctx' } as unknown) as State;
    const metadata = { gameName: 'A' } as Server.GameMetadata;
    // Insert 2 entries
    await db.createGame('gameID_0', { initialState, metadata });
    await db.createGame('gameID_1', { initialState, metadata });
    // Remove 1
    await db.wipe('gameID_1');
    const games = await db.listGames();
    expect(games).toContain('gameID_0');
    expect(games).not.toContain('gameID_1');
    await db.wipe('gameID_1');
  });
});
