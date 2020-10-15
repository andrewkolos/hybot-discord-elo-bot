import { EloDataService, UserRatingPair, DatedMatchOutcome } from '../../elo-data-service';
import { Pool, MysqlError } from 'mysql';
import { Snowflake } from 'discord.js';
import { tablesExist, createUserTable, createMatchTable } from './table-management';
import dedent = require('dedent');
import { getUsersAsOrderedPair } from '../../../common';

export class MySqlEloDataService implements EloDataService {

  private constructor(private pool: Pool, private userTableName: string, private matchTableName: string) { }

  /**
   * Creates service.
   * @param pool The my-sql pool to use to communicate with the database.
   * @param userTableName The name of the table of users to read/write to.
   * @param matchTableName The name of the table of match records to read/write to.
   * @param [createMissingTables] Whether to create the user and/or match tables if
   *   they do not already exist or to throw an error instead.
   * @returns The data instance service.
   */
  public static async createService(pool: Pool, userTableName: string, matchTableName: string,
    createMissingTables: boolean = false): Promise<MySqlEloDataService> {

    pool.config.timezone = 'UTC+0';

    const tableNames: string[] = [userTableName, matchTableName];
    const doesTableExist: boolean[] = await tablesExist(pool, tableNames);

    const tableCreators: Promise<void>[] = [];

    const missingTables = doesTableExist.map((tableExists, index) => {
      return tableExists ? null : tableNames[index];
    }).filter(value => value != null);

    if (missingTables.length > 0) {
      if (createMissingTables) {
        if (missingTables.includes(userTableName)) tableCreators.push(createUserTable(pool, userTableName));
        if (missingTables.includes(matchTableName)) tableCreators.push(createMatchTable(pool, matchTableName));
      } else {
        throw new Error(dedent`There are missing tables: ${missingTables}.
                               Use the built-in functions to create the tables, or set the createMissingTables parameter.`);
      }
    }

    await Promise.all(tableCreators);

    return new MySqlEloDataService(pool, userTableName, matchTableName);
  }

  /** @inheritdoc */
  public isUserRated(user: Snowflake, server: Snowflake): Promise<boolean> {
    const query = 'SELECT rating FROM ?? WHERE user = ? AND server = ?';
    const params = [this.userTableName, user, server];
    return new Promise<boolean>((resolve, reject) =>
      this.pool.query(query, params, (err, results) => {
        if (err) reject(err);
        resolve(results[0] != null);
      })
    );
  }

  /** @inheritdoc */
  public getRating(user: Snowflake, server: Snowflake): Promise<number | undefined> {
    const query = 'SELECT rating FROM ?? WHERE user = ? AND server = ?';
    const params = [this.userTableName, user, server];

    return new Promise<number>((resolve, reject) =>
      this.pool.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          const result: number | undefined = results[0];
          resolve(result != null ? results[0].rating : undefined);
        }
      }));
  }

  /** @inheritdoc */
  public getTopNPlayers(server: Snowflake, n: number): Promise<UserRatingPair[]> {
    const query = 'SELECT user, rating FROM ?? WHERE server = ? ORDER BY rating DESC LIMIT ?';
    const params = [this.userTableName, server, n];

    return new Promise((resolve, reject) =>
      this.pool.query(query, params, (err: MysqlError | null, results: any[]) => {
        if (err) {
          reject(err);
        } else {
          const topUsers: UserRatingPair[] = results.map(result => ({ user: result.user, rating: result.rating }));

          resolve(topUsers);
        }
      }));
  }

  /** @inheritdoc */
  public setRating(user: Snowflake, server: Snowflake, rating: number): Promise<void> {
    const query = dedent`INSERT INTO ?? (user,server,rating) VALUES (?,?,?)
                         ON DUPLICATE KEY UPDATE rating=VALUES(rating)`;
    const params = [this.userTableName, user, server, rating];

    return new Promise<void>((resolve, reject) =>
      this.pool.query(query, params, function (err, _results) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }));
  }

  /** @inheritdoc */
  public addMatch(user: Snowflake, otherUser: Snowflake, server: Snowflake, date: Date, winner: Snowflake, author: Snowflake): Promise<void> {
    const [user1, user2] = getUsersAsOrderedPair(user, otherUser);
    const formattedDate = this.dateToMySqlDate(date);

    const query = dedent`INSERT INTO ?? (user1,user2,server,record_date,winner,author)
                         VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [this.matchTableName, user1, user2, server, formattedDate, winner, author];

    return new Promise((resolve, reject) =>
      this.pool.query(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }));
  }

  /** @inheritdoc */
  public getMatchHistory(user: string, otherUser: string, server: string, startDate?: Date, endDate?: Date): Promise<DatedMatchOutcome[]> {

    const [user1, user2] = getUsersAsOrderedPair(user, otherUser);

    const params: any[] = [];

    let query = 'SELECT * FROM ?? WHERE user1 = ? AND user2 = ? AND server = ? ';
    if (startDate != null) {
      query = query + 'AND record_date >= ? ';
      params.push(this.dateToMySqlDate(startDate));
    }
    if (endDate != null) {
      query = query + 'AND record_date <= ? ';
      params.push(this.dateToMySqlDate(endDate));
    }

    query = query + 'ORDER BY record_date ASC ';

    params.unshift(this.matchTableName, user1, user2, server);

    return new Promise((resolve, reject) =>
      this.pool.query(query, params, function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results.map((result: any) => {
            const matchOutcome: DatedMatchOutcome = {
              date: new Date(result.record_date),
              winner: result.winner,
              author: result.author
            };

            return matchOutcome;
          }));
        }
      }));
  }

  /**
   * Deletes all user and match data.
   * @returns Promise that is resolved when the operation is complete.
   */
  public async deleteAllData(): Promise<void> {
    const tables = [this.userTableName, this.matchTableName];

    await Promise.all(tables.map((table: string) => {
      const query = `DELETE FROM ${table}`;
      return new Promise((resolve, reject) => {
        this.pool.query(query, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }));
  }

  /**
   * Deletes all matches data for the specified server.
   * @param server The snowflake of the server that will have its match data deleted.
   */
  public deleteAllMatchesForServer(server: Snowflake): Promise<void> {
    const query = 'DELETE FROM ?? WHERE server = ?';
    const params = [this.matchTableName, server];

    return new Promise<void>((resolve, reject) =>
      this.pool.query(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          console.log(`Deleted all matches for ${server}.`);
          resolve();
        }
      }));
  }

  /**
   * Deletes all user data for a specified server.
   * @param server The snowflake of the server that will have its user data deleted.
   */
  public deleteAllUsersForServer(server: Snowflake): Promise<void> {
    const query = 'DELETE FROM ?? WHERE server = ?';
    const params = [this.userTableName, server];

    return new Promise<void>((resolve, reject) =>
      this.pool.query(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          console.log(`Deleted all matches for ${server}.`);
          resolve();
        }
      }));
  }

  /**
   * Converts a JS Date object to a string representation compatible
   * with the MySQL datetime format.
   * @param date The date.
   * @returns A string representation of the date, formatted correctly for MySQL.
   */
  private dateToMySqlDate(date: Date) {
    const isoString = date.toISOString();
    let formattedString = isoString.slice(0, 23);
    formattedString = formattedString.replace('T', ' ');
    return formattedString;
  }
}

// TODO: add GetOrDefault to data service, consider removing any unused methods.
