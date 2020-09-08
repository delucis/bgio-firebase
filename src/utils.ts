import { Server } from 'boardgame.io';

/**
 * Custom data type for storing match data with bgio-firebase custom fields.
 */
export type ExtendedMatchData = Server.MatchData & { isGameover: boolean };

/**
 * Add custom fields to the default boardgame.io match data object.
 * @param matchData boardgame.io match data object.
 * @return The match data object with additional fields.
 */
export const extendMatchData = (
  matchData: Server.MatchData
): ExtendedMatchData => ({
  ...matchData,
  isGameover: matchData.gameover !== undefined,
});

/**
 * Remove custom fields from extended match data.
 * @param extendedMatchData Extended match data object.
 * @return The match data object as expected by boardgame.io.
 */
export const standardiseMatchData = (
  extendedMatchData: ExtendedMatchData
): Server.MatchData => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isGameover, ...matchData } = extendedMatchData;
  return matchData;
};
