import { EloDataService, DatedMatchOutcome, UserRatingPair } from '../../elo-data-service';
import Sqlite, { Database } from 'better-sqlite3';
import dedent from 'dedent';
import { getUsersAsOrderedPair } from '../../../common';

const sanitizeTableName = (name: string) => name.replace(/[^A-Za-z0-9_]/g, '');

export class SqliteEloDataService implements EloDataService {

  private db: Database;

  private userTableName: string;
  private matchTableName: string;

  private constructor(filePath: string, userTableName: string, matchTableName: string) {
    userTableName = sanitizeTableName(userTableName);
    matchTableName = sanitizeTableName(matchTableName);

    this.userTableName = userTableName;
    this.matchTableName = matchTableName;

    this.db = Sqlite(filePath);

    if (!this.tableExists(userTableName)) this.createUserTable();
    if (!this.tableExists(matchTableName)) this.createMatchTable();
  }

  /**
   * Creates a service that reads/writes data from/to a database file. Data is persistent.
   * @param filepath The path to the database file.
   * @param userTableName The name of the user table.
   * @param matchTableName The name of the match table.
   * @returns A data service instance.
   */
  public static createPersistentService(filepath: string, userTableName: string, matchTableName: string): SqliteEloDataService {
    return new SqliteEloDataService(filepath, userTableName, matchTableName);
  }

  /**
   * Creates a service that reads/writes data from memory. Data is not persistent and lost when the process terminates.
   * @returns A data service instance.
   */
  public static createInMemoryService(): SqliteEloDataService {
    return new SqliteEloDataService(':memory:', 'users', 'matches');
  }

  /**
   * Closes the database connection.
   */
  public close() {
    this.db.close();
  }

  /** @inheritdoc */
  public isUserRated(user: string, server: string): Promise<boolean> {
    const query = `SELECT * FROM ${this.userTableName} WHERE user = ? AND server = ?`;

    const statement = this.db.prepare(query);
    const result = statement.get(user, server);

    return Promise.resolve(result != null);
  }

  /** @inheritdoc */
  public getRating(user: string, server: string): Promise<number | undefined> {
    const query = `SELECT * FROM ${this.userTableName} WHERE user = ? AND server = ?`;

    const statement = this.db.prepare(query);
    const result = statement.get(user, server);

    return result == null ? Promise.resolve(undefined) : Promise.resolve(result.rating);
  }

  /** @inheritdoc */
  public setRating(user: string, server: string, rating: number): Promise<void> {
    const query = dedent`INSERT INTO ${this.userTableName}(user,server,rating) VALUES (?, ?, ?)`;

    const statement = this.db.prepare(query);
    statement.run(user, server, rating);

    return Promise.resolve();
  }

  /** @inheritdoc */
  public addMatch(user: string, otherUser: string, server: string, date: Date, winner: string, author: string): Promise<void> {
    const [user1, user2] = getUsersAsOrderedPair(user, otherUser);

    const query = `INSERT INTO ${this.matchTableName} (user1,user2,server,date,winner,author) VALUES (?,?,?,?,?,?)`;
    const statement = this.db.prepare(query);
    statement.run(user1, user2, server, date.toISOString(), winner, author);

    return Promise.resolve();
  }

  /** @inheritdoc */
  public getMatchHistory(user: string, otherUser: string, server: string, startDate?: Date, endDate?: Date): Promise<DatedMatchOutcome[]> {
    const [user1, user2] = getUsersAsOrderedPair(user, otherUser);

    const params: any[] = [];

    let query = `SELECT date, winner, author FROM ${this.matchTableName} WHERE user1 = ? AND user2 = ? AND server = ? `;

    if (startDate != null) {
      query = query + 'AND date >= ? ';
      params.push(startDate.toISOString());
    }
    if (endDate != null) {
      query = query + 'AND date <= ? ';
      params.push(endDate.toISOString());
    }

    query = query + 'ORDER BY date ASC';
    params.unshift(user1, user2, server);

    const statement = this.db.prepare(query);
    const results = statement.all(...params);

    return Promise.resolve(results.map((result: any) => {
      return {
        date: new Date(result.date),
        winner: result.winner,
        author: result.author
      };
    }));
  }

  /** @inheritdoc */
  public getTopNPlayers(server: string, n: number): Promise<UserRatingPair[]> {
    const query = `SELECT user, rating FROM ${this.userTableName} WHERE server = ? ORDER BY rating DESC LIMIT ?`;
    const statement = this.db.prepare(query);
    const results = statement.all(server, n);

    return Promise.resolve(results);
  }

  /**
   * Deletes all data.
   */
  public deleteAllData() {
    const tables = [this.userTableName, this.matchTableName];

    tables.forEach((table: string) => {
      const query = `DELETE FROM ${table}`;
      const statement = this.db.prepare(query);
      statement.run();
    });
  }

  /**
   * Determines whether the table with the given name exists.
   * @param tableName The name of the table to look for.
   * @returns `true` if the table exists, `false` otherwise.
   */
  private tableExists(tableName: string) {
    tableName = sanitizeTableName(tableName);

    const query = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
    const resp = query.get(tableName);

    return resp != null;
  }

  /**
   * Creates the user table.
   */
  private createUserTable() {
    const tableQuery =
      dedent`CREATE TABLE ${this.userTableName} (
            user varchar(64),
            server varchar(64),
            rating smallint,
            UNIQUE(user,server) ON CONFLICT REPLACE
            )`;

    const tableStatement = this.db.prepare(tableQuery);
    tableStatement.run();

    const indexQuery = dedent`CREATE INDEX ${this.userTableName}_user_server
                                                ON ${this.userTableName} (user, server)`;

    const indexStatement = this.db.prepare(indexQuery);
    indexStatement.run();
  }

  /**
   * Creates the match table.
   */
  private createMatchTable() {
    const tableQuery = dedent`CREATE TABLE ${this.matchTableName} (
                        user1 varchar(64),
                        user2 varchar(64),
                        server varchar(64),
                        date text,
                        winner varchar(64),
                        author varchar(64)
                        )`;

    const tableStatement = this.db.prepare(tableQuery);
    tableStatement.run();

    const indexQuery = dedent`CREATE INDEX ${this.matchTableName}_users_server_date
                              ON ${this.matchTableName} (user1, user2, server, date)`;

    const indexStatement = this.db.prepare(indexQuery);
    indexStatement.run();
  }
}
