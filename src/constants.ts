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
