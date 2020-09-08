import admin from 'firebase-admin';

export interface FirebaseDBOpts {
  app?: string;
  config?: admin.AppOptions;
  dbPrefix?: string;
  ignoreUndefinedProperties?: boolean;
  useCompositeIndexes?: boolean;
}

export const DB_PREFIX = 'bgio_';

export enum DBTable {
  'Metadata' = 'metadata',
  'State' = 'state',
  'InitialState' = 'initialState',
  'Log' = 'log',
}

export const tables = [
  DBTable.Metadata,
  DBTable.State,
  DBTable.InitialState,
  DBTable.Log,
] as const;

export type Tables = typeof tables[number];
