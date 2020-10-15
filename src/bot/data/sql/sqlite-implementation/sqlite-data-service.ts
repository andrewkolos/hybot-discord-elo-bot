import { EloDataService, DatedMatchOutcome, UserRatingPair } from '../../elo-data-service';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import dedent from 'dedent';
import { getUsersAsOrderedPair } from '../../../common';

const sanitizeTableName = (name: string) => name.replace(/[^A-Za-z0-9_]/g, '');

export interface SqliteEloDataServiceArgs {
  /** The path to the database file. */
  filePath: string;
  /** The name of the user table. */
  userTableName: string;
  /** The name of the match table. */
  matchTableName: string;
}

export class SqliteEloDataService implements EloDataService {

  /**
   * Creates a service that reads/writes data from/to a database file. Data is persistent.
   * @param userTableName The name of the user table.
   * @param matchTableName The name of the match table.
   * @returns A data service instance.
   */
  public static async createPersistentService(args: SqliteEloDataServiceArgs): Promise<SqliteEloDataService> {
    const db = await open({
      filename: args.filePath,
      driver: sqlite3.Database,
    });
    return new SqliteEloDataService(db, args.userTableName, args.matchTableName).createTablesIfDoNotExist();
  }

  /**
   * Creates a service that reads/writes data from memory. Data is not persistent and lost when the process terminates.
   * @returns A data service instance.
   */
  public static async createInMemoryService(): Promise<SqliteEloDataService> {
    const db = await open({
      filename: ':memory:',
      driver: sqlite3.Database,
    });
    return new SqliteEloDataService(db, 'users', 'matches').createTablesIfDoNotExist();
  }

  private readonly userTableName: string;
  private readonly matchTableName: string;

  private constructor(private readonly db: Database<sqlite3.Database, sqlite3.Statement>,
    userTableName: string, matchTableName: string) {

    userTableName = sanitizeTableName(userTableName);
    matchTableName = sanitizeTableName(matchTableName);

    this.userTableName = userTableName;
    this.matchTableName = matchTableName;
  }

  /**
   * Closes the database connection.
   */
  public async close() {
    await this.db.close();
  }

  /** @inheritdoc */
  public async isUserRated(user: string, server: string): Promise<boolean> {
    const query = `SELECT * FROM ${this.userTableName} WHERE user = ? AND server = ?`;
    const result = await this.db.get(query, user, server);
    return result != null;
  }

  /** @inheritdoc */
  public async getRating(user: string, server: string): Promise<number | undefined> {
    const query = `SELECT * FROM ${this.userTableName} WHERE user = ? AND server = ?`;
    const result = await this.db.get(query, user, server);
    return result != null ? result.rating : -1;
  }

  /** @inheritdoc */
  public async setRating(user: string, server: string, rating: number): Promise<void> {
    const query = dedent`INSERT INTO ${this.userTableName} (user,server,rating) VALUES (?, ?, ?)`;
    await this.db.run(query, user, server, rating);
  }

  /** @inheritdoc */
  public async addMatch(user: string,
    otherUser: string,
    server: string,
    date: Date,
    winner: string,
    author: string): Promise<void> {

    const [user1, user2] = getUsersAsOrderedPair(user, otherUser);

    const query = `INSERT INTO ${this.matchTableName} (user1,user2,server,date,winner,author) VALUES (?,?,?,?,?,?)`;
    await this.db.run(query, user1, user2, server, date.toISOString(), winner, author);
  }

  /** @inheritdoc */
  public async getMatchHistory(user: string,
    otherUser: string,
    server: string,
    startDate?: Date,
    endDate?: Date): Promise<DatedMatchOutcome[]> {

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

    const results = await this.db.all(query, ...params);
    return results.map((result: any) => ({
      date: new Date(result.date),
      winner: result.winner,
      author: result.author,
    }));
  }

  /** @inheritdoc */
  public async getTopNPlayers(server: string, n: number): Promise<UserRatingPair[]> {
    const query = `SELECT user, rating FROM ${this.userTableName} WHERE server = ? ORDER BY rating DESC LIMIT ?`;
    const results = await this.db.all(query, server, n);
    return results;
  }

  /**
   * Deletes all data.
   */
  public async deleteAllData(): Promise<this> {
    const tables = [this.userTableName, this.matchTableName];
    const promises = tables.map(async (table: string) => this.db.exec(`DELETE FROM ${table}`));
    await Promise.all(promises);
    return this;
  }

  /**
   * Determines whether the table with the given name exists.
   * @param tableName The name of the table to look for.
   * @returns `true` if the table exists, `false` otherwise.
   */
  private async tableExists(tableName: string) {
    tableName = sanitizeTableName(tableName);
    const query = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?';
    const resp = await this.db.get(query, tableName);
    return resp != null;
  }

  /**
   * Creates the user table.
   */
  private async createUserTable() {
    const tableQuery =
      dedent`CREATE TABLE ${this.userTableName} (
            user varchar(64),
            server varchar(64),
            rating smallint,
            UNIQUE(user,server) ON CONFLICT REPLACE
            )`;

    await this.db.exec(tableQuery);

    const indexQuery = dedent`CREATE INDEX ${this.userTableName}_user_server
                                                ON ${this.userTableName} (user, server)`;

    await this.db.exec(indexQuery);
  }

  /**
   * Creates the match table.
   */
  private async createMatchTable() {
    const tableQuery = dedent`CREATE TABLE ${this.matchTableName} (
                        user1 varchar(64),
                        user2 varchar(64),
                        server varchar(64),
                        date text,
                        winner varchar(64),
                        author varchar(64)
                        )`;

    await this.db.exec(tableQuery);

    const indexQuery = dedent`CREATE INDEX ${this.matchTableName}_users_server_date
                              ON ${this.matchTableName} (user1, user2, server, date)`;

    await this.db.exec(indexQuery);
  }

  private async createTablesIfDoNotExist(): Promise<this> {
    const tasks: Array<Promise<unknown>> = [];
    if (!await this.tableExists(this.userTableName)) tasks.push(this.createUserTable());
    if (!await this.tableExists(this.matchTableName)) tasks.push(this.createMatchTable());
    await Promise.all(tasks);
    return this;
  }
}
