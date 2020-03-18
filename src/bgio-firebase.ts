/*
 * Copyright 2017–20 Chris Swithinbank & the boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import LRU from 'lru-cache';
import admin from 'firebase-admin';
import { Firestore } from './db/firestore';
import { RTDB } from './db/rtdb';

type State = Record<string, any>;

export enum Engine {
  FIRESTORE = 'Firestore',
  RTDB = 'RTDB',
}

export interface FirebaseDBOpts {
  config?: admin.AppOptions;
  dbname?: string;
  engine?: Engine;
  cacheSize?: number;
}

/**
 * Firebase RTDB/Firestore connector.
 */
export class FirebaseDB {
  client: typeof admin;
  config: admin.AppOptions;
  dbname: string;
  cache: LRU<string, State>;
  db: Firestore | RTDB;

  /**
   * Creates a new Firebase connector object.
   * The default engine is Firestore.
   * @constructor
   */
  constructor({
    config = {},
    dbname = 'bgio',
    engine = Engine.FIRESTORE,
    cacheSize = 1000,
  }: FirebaseDBOpts = {}) {
    this.client = admin;
    const dbOpts = { dbname };
    this.db = engine === Engine.RTDB ? new RTDB(dbOpts) : new Firestore(dbOpts);
    this.config = config;
    this.dbname = dbname;
    this.cache = new LRU({ max: cacheSize });
  }

  /**
   * Connect to the instance.
   */
  async connect(): Promise<void> {
    this.client.initializeApp(this.config);
    await this.db.connect(this.client);
  }

  /**
   * Write the game state.
   * @param {string} gameID - The game id.
   * @param {object} store - A game state to persist.
   */
  async set(gameID: string, state: State): Promise<void> {
    const cacheValue = this.cache.get(gameID);
    if (cacheValue && cacheValue._stateID >= state._stateID) {
      return;
    }

    this.cache.set(gameID, state);
    await this.db.set(gameID, state);
  }

  /**
   * Read the game state.
   * @param {string} gameID - The game id.
   * @returns {object} - A game state, or undefined
   *                     if no game is found with this id.
   */
  async get(gameID: string): Promise<State | undefined> {
    let cacheValue = this.cache.get(gameID);
    if (cacheValue !== undefined) {
      return cacheValue;
    }

    let oldStateID = 0;
    cacheValue = this.cache.get(gameID);
    /* istanbul ignore next line */
    if (cacheValue !== undefined) {
      /* istanbul ignore next line */
      oldStateID = cacheValue._stateID;
    }

    const doc = await this.db.get(gameID);
    let newStateID = -1;
    if (doc) {
      newStateID = doc._stateID;
    }

    // Update the cache, but only if the read
    // value is newer than the value already in it.
    // A race condition might overwrite the
    // cache with an older value, so we need this.
    if (newStateID >= oldStateID) {
      this.cache.set(gameID, doc);
    }

    if (doc === null) {
      return undefined;
    }

    return doc;
  }

  /**
   * Check if a particular game exists.
   * @param {string} gameID - The game id.
   * @returns {boolean} - True if a game with this id exists.
   */
  async has(gameID: string): Promise<boolean> {
    const cacheValue = this.cache.get(gameID);
    if (cacheValue !== undefined) {
      return true;
    }
    return this.db.has(gameID);
  }

  /**
   * Remove the game state from the DB.
   * @param {string} gameID - The game id.
   */
  async remove(gameID: string): Promise<void> {
    if (!(await this.has(gameID))) return;
    await this.db.remove(gameID);
    this.cache.del(gameID);
  }

  /**
   * Return all gameIDs.
   * @returns {array} - Array of gameIDs (strings)
   */
  async list(): Promise<string[]> {
    return this.db.list();
  }
}
