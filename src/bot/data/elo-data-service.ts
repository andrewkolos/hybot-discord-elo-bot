import { Snowflake } from 'discord.js';

export type UserRatingPair = {user: Snowflake, rating: number};

export type DatedMatchOutcome = {
  date: Date;
  winner: Snowflake;
  author: Snowflake;
};

export interface EloDataService {

  /**
   * Determines whether the given user has a rating defined on the given server.
   * @param user The user snowflake.
   * @param server The server snowflake.
   * @returns As a promise, `true` if the user is rated on the server. `false` otherwise.
   */
  isUserRated(user: Snowflake, server: Snowflake): Promise<boolean>;

  /**
   * Gets the user's rating on a particular server.
   * @param user The user snowflake.
   * @param server The server snowflake.
   * @returns A promise for the user's rating on the specified server.
   */
  getRating(user: Snowflake, server: Snowflake): Promise<number | undefined>;

  /**
   * Sets the user's rating on a particular server.
   * @param user The user snowflake.
   * @param server The server snowflake.
   * @param rating The rating to assign to the user.
   * @returns A promise resolved after the operation is complete.
   */
  setRating(user: Snowflake, server: Snowflake, rating: number): Promise<void>;

  /**
   * Record a match between two players. Does not update player ratings.
   * @param user The snowflake of one of the two users.
   * @param otherUser The snowflake of the other user.
   * @param server The snowflake of the server.
   * @param date  The date/time of the match.
   * @param winner The snowflake of the user that won the match.
   * @param author The snowflake of the user that is recording the match.
   * @returns A promise resolved after the operation is complete.
   */
  addMatch(user: Snowflake, otherUser: Snowflake, server: Snowflake, date: Date, winner: Snowflake,
    author: Snowflake): Promise<void>;

  /**
   * Gets the history of matches between two users.
   * @param user1 One of the user's snowflake.
   * @param user2 The other user's snowflake.
   * @param server The server's snowflake.
   * @param startDate The start of the range of dates in which to search for matches. If not supplied, searches starting
   *  from the beginning of time.
   * @param endDate The end of the range of dates in which to search for matches. If not supplied, searches up to the end of time.
   * @returns A list of matches between the two user's on the specified server, including their outcomes.
   */
  getMatchHistory(user1: Snowflake, user2: Snowflake, server: Snowflake, startDate?: Date, endDate?: Date): Promise<DatedMatchOutcome[]>;

  /**
   * Gets the N top-rated players on a particular server.
   * @param server The server's snowflake.
   * @param n N.
   * @returns The N top-rated users on the server, including their ratings, specified in descending
   * order of rating.
   */
  getTopNPlayers(server: Snowflake, n: number): Promise<UserRatingPair[]>;
}
