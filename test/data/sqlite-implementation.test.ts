import { SqliteEloDataService, SqliteEloDataServiceArgs } from '../../src/bot/data/sql/sqlite-implementation/sqlite-data-service';
import { SnowflakeUtil } from 'discord.js';
import { dateDiffInMinutes, dayBefore, withinOneMs } from './util';
import { DatedMatchOutcome } from 'src/bot/data/elo-data-service';

const persistenceArgs: SqliteEloDataServiceArgs = {
  filePath: './sqlite-test.db',
  userTableName: 'user_table_test',
  matchTableName: 'match_table_test',
};

const getPersistentService = async () => SqliteEloDataService.createPersistentService(persistenceArgs);

const server1 = SnowflakeUtil.generate();
const server2 = SnowflakeUtil.generate();
const user1 = SnowflakeUtil.generate();
const user2 = SnowflakeUtil.generate();

describe(nameof<SqliteEloDataService>(), () => {

  it("can store a user's rating", async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();
    const rating = 123;

    await dataService.setRating(user1, server1, rating);

    await expect(dataService.getRating(user1, server1)).resolves.toEqual(rating);
  });

  it("uniquely identifies a user's rating by server", async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();
    const ratingOnServer1 = 123;
    const ratingOnServer2 = 456;

    await dataService.setRating(user1, server1, ratingOnServer1);
    await dataService.setRating(user1, server2, ratingOnServer2);

    await expect(dataService.getRating(user1, server1)).resolves.toEqual(ratingOnServer1);
    await expect(dataService.getRating(user1, server2)).resolves.toEqual(ratingOnServer2);
  });

  it('correctly identifies the top N players', async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();

    const user1Rating = 11;
    const user2Rating = 22;
    const user3 = SnowflakeUtil.generate();
    const user3Rating = 33;
    const user4 = SnowflakeUtil.generate();
    const user4Rating = 44;
    const user5 = SnowflakeUtil.generate();
    const user5Rating = 55;

    await dataService.setRating(user2, server1, user2Rating);
    await dataService.setRating(user4, server1, user4Rating);
    await dataService.setRating(user3, server1, user3Rating);
    await dataService.setRating(user1, server1, user1Rating);
    await dataService.setRating(user5, server1, user5Rating);

    const top2 = await dataService.getTopNPlayers(server1, 2);
    expect(top2[0]).toEqual({ user: user5, rating: user5Rating });
    expect(top2[1]).toEqual({ user: user4, rating: user4Rating });
  });

  it('can correctly retrieve matches that occur on or after a given start date (precise within two seconds)', async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();

    const now = new Date();
    const oneSecondAfterNow = new Date(new Date().valueOf() + 2);
    const oneSecondBeforeNow = new Date(new Date().valueOf() - 2);

    await dataService.addMatch(user1, user2, server1, now, user1, user2);
    await dataService.addMatch(user1, user2, server1, oneSecondAfterNow, user1, user2);
    await dataService.addMatch(user1, user2, server1, oneSecondBeforeNow, user1, user2);

    const matches = await dataService.getMatchHistory(user1, user2, server1, now);

    let foundOneMsBeforeMatch = false;
    let foundNowMatch = false;
    let foundOneMsAfterMatch = false;

    matches.forEach((match: DatedMatchOutcome) => {
      if (withinOneMs(match.date, now)) foundNowMatch = true;
      if (withinOneMs(match.date, oneSecondAfterNow)) foundOneMsAfterMatch = true;
      if (withinOneMs(match.date, oneSecondBeforeNow)) foundOneMsBeforeMatch = true;
    });

    expect(foundNowMatch).toBe(true);
    expect(foundOneMsAfterMatch).toBe(true);
    expect(foundOneMsBeforeMatch).toBe(false);
  });

  it('can correctly retrieve matches that occur on or before a given end date (precise within two seconds)', async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();

    const now = new Date();
    const oneSecondAfterNow = new Date(new Date().valueOf() + 2);
    const oneSecondBeforeNow = new Date(new Date().valueOf() - 2);

    await dataService.addMatch(user1, user2, server1, now, user1, user2);
    await dataService.addMatch(user1, user2, server1, oneSecondAfterNow, user1, user2);
    await dataService.addMatch(user1, user2, server1, oneSecondBeforeNow, user1, user2);

    const matches = await dataService.getMatchHistory(user1, user2, server1, now);

    let foundOneMsBeforeMatch = false;;
    let foundNowMatch = false;
    let foundOneMsAfterMatch = false;

    matches.forEach((match: DatedMatchOutcome) => {
      if (withinOneMs(match.date, now)) foundNowMatch = true;
      if (withinOneMs(match.date, oneSecondAfterNow)) foundOneMsAfterMatch = true;
      if (withinOneMs(match.date, oneSecondBeforeNow)) foundOneMsBeforeMatch = true;
    });

    expect(foundNowMatch).toBe(true);
    expect(foundOneMsAfterMatch).toBe(true);
    expect(foundOneMsBeforeMatch).toBe(false);
  });

  it('can correctly retrieve matches that occur within a given date range (precise within two seconds)', async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();

    const now = new Date();
    const oneSecondAfterNow = new Date(new Date().valueOf() + 2);
    const oneSecondBeforeNow = new Date(new Date().valueOf() - 2);

    await dataService.addMatch(user1, user2, server1, now, user1, user2);
    await dataService.addMatch(user1, user2, server1, oneSecondAfterNow, user1, user2);
    await dataService.addMatch(user1, user2, server1, oneSecondBeforeNow, user1, user2);

    const matches = await dataService.getMatchHistory(user1, user2, server1, now, now);

    let foundOneMsBeforeMatch = false;
    let foundNowMatch = false;
    let foundOneMsAfterMatch = false;

    matches.forEach((match: DatedMatchOutcome) => {
      if (withinOneMs(match.date, now)) foundNowMatch = true;
      if (withinOneMs(match.date, oneSecondAfterNow)) foundOneMsAfterMatch = true;
      if (withinOneMs(match.date, oneSecondBeforeNow)) foundOneMsBeforeMatch = true;
    });

    expect(foundNowMatch).toBe(true);
    expect(foundOneMsAfterMatch).toBe(false);
    expect(foundOneMsBeforeMatch).toBe(false);
  });

  it('correctly stores match history between two players (and in chronological order)', async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();

    const today = new Date();
    const todaysWinner = user2;
    const todaysAuthor = user1;
    const yesterday = dayBefore(today);
    const yesterdaysWinner = user1;
    const yesterdaysAuthor = user2;
    const twoDaysAgo = dayBefore(yesterday);
    const twoDaysAgosWinner = user2;
    const twoDaysAgosAuthor = user2;

    await dataService.addMatch(user1, user2, server1, today, todaysWinner, todaysAuthor);
    await dataService.addMatch(user1, user2, server1, twoDaysAgo, twoDaysAgosWinner, twoDaysAgosAuthor);
    await dataService.addMatch(user1, user2, server1, yesterday, yesterdaysWinner, yesterdaysAuthor);

    const matchHistory = await dataService.getMatchHistory(user1, user2, server1);

    expect(dateDiffInMinutes(matchHistory[0].date, twoDaysAgo)).toBe(0);
    expect(matchHistory[0].winner).toBe(twoDaysAgosWinner);
    expect(matchHistory[0].author).toBe(twoDaysAgosAuthor);

    expect(dateDiffInMinutes(matchHistory[1].date, yesterday)).toBe(0);
    expect(matchHistory[1].winner).toBe(yesterdaysWinner);
    expect(matchHistory[1].author).toBe(yesterdaysAuthor);

    expect(dateDiffInMinutes(matchHistory[2].date, today)).toBe(0);
    expect(matchHistory[2].winner).toBe(todaysWinner);
    expect(matchHistory[2].author).toBe(todaysAuthor);
  });

  it('correctly stores match history across multiple servers', async () => {
    const dataService = await SqliteEloDataService.createInMemoryService();

    const now = new Date();
    const authorOnServer1 = user1;
    const winnerOnServer1 = user2;
    const authorOnServer2 = user2;
    const winnerOnServer2 = user1;

    await dataService.addMatch(user1, user2, server1, now, winnerOnServer1, authorOnServer1);
    await dataService.addMatch(user1, user2, server2, now, winnerOnServer2, authorOnServer2);

    const matchOnServer1 = (await dataService.getMatchHistory(user1, user2, server1))[0];
    const matchOnServer2 = (await dataService.getMatchHistory(user1, user2, server2))[0];

    expect(matchOnServer1.winner).toBe(winnerOnServer1);
    expect(matchOnServer1.author).toBe(authorOnServer1);

    expect(matchOnServer2.winner).toBe(winnerOnServer2);
    expect(matchOnServer2.author).toBe(authorOnServer2);
  });

  describe('persistent', () => {
    it('persists ratings across data service instances', async () => {

      const service = await getPersistentService();

      const user = SnowflakeUtil.generate();
      const server = SnowflakeUtil.generate();
      const rating = 123;

      await service.setRating(user, server, rating);

      await service.close();

      const nextService = await getPersistentService();

      expect(await nextService.getRating(user, server)).toBe(rating);

      await nextService.close();
    });

    it('persists matches across data services instances', async () => {
      const service = await getPersistentService();

      const user1 = SnowflakeUtil.generate();
      const user2 = SnowflakeUtil.generate();
      const server = SnowflakeUtil.generate();
      const date = new Date();
      const winner = user1;
      const author = user2;

      await service.addMatch(user1, user2, server, date, winner, author)

      await service.close();

      const nextService = await getPersistentService();

      const matchHistory = await nextService.getMatchHistory(user1, user2, server);

      expect(matchHistory[0].date.getTime()).toBe(date.getTime());
      expect(matchHistory[0].author).toBe(author);
      expect(matchHistory[0].winner).toBe(winner);
      
      await nextService.close();
    });
  });
});
