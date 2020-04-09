/*
 * Copyright 2017–20 Chris Swithinbank & the boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import firebase from '@firebase/testing';
import { LogEntry, Server, State } from 'boardgame.io';
import { tables } from '../src/db/shared';
import { Firestore } from '../src/bgio-firebase';

const projectId = 'bgio-firebase-tests';

describe('Firestore', () => {
  let db: Firestore;

  beforeEach(async () => {
    // instantiate new database instance for each test
    db = new Firestore({
      config: { projectId },
    });
    await db.connect();
  });

  afterEach(async () => {
    // clean database after each test
    const ids = await db.listGames();
    await Promise.all(ids.map((id) => db.wipe(id)));
  });

  afterAll(async () => {
    // close connections to emulator after testing
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  describe('construction', () => {
    test('defaults', () => {
      db = new Firestore();
      for (const table of tables) {
        const ref = db[table];
        expect(ref.id).toBe('bgio_' + table);
      }
    });

    test('custom database prefix', () => {
      const dbPrefix = 'a';
      db = new Firestore({ dbPrefix });
      for (const table of tables) {
        const ref = db[table];
        expect(ref.id).toBe(dbPrefix + table);
      }
    });

    test('can specify app name', () => {
      db = new Firestore({ config: { projectId }, app: 'customApp' });
      expect(
        db.client.apps.some((app) => app && app.name === 'customApp')
      ).toBe(true);
    });
  });

  describe('#fetch', () => {
    test('fields are undefined when no game exists', async () => {
      const data = await db.fetch('nonexistentGameID', {
        state: true,
        initialState: true,
        metadata: true,
        log: true,
      });
      expect(data.state).toBeUndefined();
      expect(data.initialState).toBeUndefined();
      expect(data.metadata).toBeUndefined();
      expect(data.log).toBeUndefined();
    });

    test('returns all fields', async () => {
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

    test('returns no fields', async () => {
      // Create game.
      const initialState = ({ G: 'G', ctx: 'ctx' } as unknown) as State;
      const metadata = { gameName: 'A' } as Server.GameMetadata;
      await db.createGame('gameID', { initialState, metadata });

      // Must return no fields.
      const data = await db.fetch('gameID', {});
      expect(data).not.toHaveProperty('state');
      expect(data).not.toHaveProperty('initialState');
      expect(data).not.toHaveProperty('metadata');
      expect(data).not.toHaveProperty('log');
    });
  });

  describe('#setState', () => {
    test('creates a state document', async () => {
      const id = 'A';
      const state = ({ G: 'G', ctx: 'ctx' } as unknown) as State;
      await db.setState(id, state);

      const data = await db.fetch(id, { state: true, metadata: true });
      expect(data.state).toEqual(state);
      expect(data.metadata).toBeUndefined();
    });

    test('updates a state document', async () => {
      // Create game.
      const id = 'B';
      const initialState = ({ G: 'G', _stateID: 0 } as unknown) as State;
      const metadata = { gameName: 'A' } as Server.GameMetadata;
      await db.createGame(id, { initialState, metadata });

      const initialData = await db.fetch(id, { state: true });
      expect(initialData.state).toEqual(initialState);

      const newState = ({ G: 'F', _stateID: 1 } as unknown) as State;
      await db.setState(id, newState);
      const data = await db.fetch(id, { state: true, initialState: true });
      expect(data.state).toEqual(newState);
      expect(data.initialState).toEqual(initialState);
    });

    test('won’t overwrite a newer state document', async () => {
      const id = 'C';
      const state = ({ G: 'G', _stateID: 1 } as unknown) as State;
      await db.setState(id, state);

      const staleState = ({ G: 'A', _stateID: 0 } as unknown) as State;
      await db.setState(id, staleState);

      const data = await db.fetch(id, { state: true });
      expect(data.state).toEqual(state);
    });

    test('concatenates game log', async () => {
      // Create game.
      const id = 'D';
      const initialState = ({ G: 'G', _stateID: 0 } as unknown) as State;
      const metadata = { gameName: 'A' } as Server.GameMetadata;
      await db.createGame(id, { initialState, metadata });

      // Update state, including deltalogs.
      const logEntry1 = { turn: 1 } as LogEntry;
      const state1 = ({ G: 'F', _stateID: 1 } as unknown) as State;
      await db.setState(id, state1, [logEntry1]);

      const logEntry2 = { turn: 2 } as LogEntry;
      const logEntry3 = { turn: 3 } as LogEntry;
      const state2 = ({ G: 'E', _stateID: 2 } as unknown) as State;
      await db.setState(id, state2, [logEntry2, logEntry3]);

      const data = await db.fetch(id, { log: true });
      expect(data.log).toEqual([logEntry1, logEntry2, logEntry3]);
    });
  });

  describe('#listGames', () => {
    test('list all entries', async () => {
      // Insert 3 entries
      await db.setMetadata('gameID_0', {
        gameName: 'A',
      } as Server.GameMetadata);
      await db.setMetadata('gameID_2', {
        gameName: 'A',
      } as Server.GameMetadata);
      await db.setMetadata('gameID_1', {
        gameName: 'B',
      } as Server.GameMetadata);
      const ids = await db.listGames();
      expect(ids).toContain('gameID_0');
      expect(ids).toContain('gameID_1');
      expect(ids).toContain('gameID_2');
    });

    test('list entries for specific gameName', async () => {
      await db.setMetadata('gameID_3', {
        gameName: 'A',
      } as Server.GameMetadata);
      await db.setMetadata('gameID_5', {
        gameName: 'A',
      } as Server.GameMetadata);
      await db.setMetadata('gameID_4', {
        gameName: 'B',
      } as Server.GameMetadata);
      const ids = await db.listGames({ gameName: 'A' });
      expect(ids).toContain('gameID_3');
      expect(ids).toContain('gameID_5');
      expect(ids).not.toContain('gameID_4');
    });
  });

  describe('#wipe', () => {
    test('removes entry', async () => {
      const initialState = ({ G: 'G', ctx: 'ctx' } as unknown) as State;
      const metadata = { gameName: 'A' } as Server.GameMetadata;
      // Insert 2 entries
      await db.createGame('gameID_6', { initialState, metadata });
      await db.createGame('gameID_7', { initialState, metadata });
      // Remove 1
      await db.wipe('gameID_7');
      const games = await db.listGames();
      expect(games).toContain('gameID_6');
      expect(games).not.toContain('gameID_7');
      const data = await db.fetch('gameID_7', {
        state: true,
        initialState: true,
        metadata: true,
        log: true,
      });
      expect(data.state).toBeUndefined();
      expect(data.initialState).toBeUndefined();
      expect(data.metadata).toBeUndefined();
      expect(data.log).toBeUndefined();
    });
  });
});
