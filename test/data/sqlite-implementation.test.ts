import { DataServiceTester } from './data-service-tester';
import { SqliteEloDataService } from '../../src/bot/data/sql/sqlite-implementation/sqlite-data-service';
import { SnowflakeUtil } from 'discord.js';

describe(nameof<SqliteEloDataService>(), () => {
  describe('in memory', () => {
    const tester = new DataServiceTester(
      () => SqliteEloDataService.createInMemoryService(),
      (ds: SqliteEloDataService) => {
        ds.deleteAllData();
      });
    tester.execute();
  });

  describe('persistent', () => {
    const tester = new DataServiceTester(
      () => SqliteEloDataService.createPersistentService('./sqlite-test.db', 'user_table_test', 'match_table_test'),
      (ds: SqliteEloDataService) => {
        ds.deleteAllData();
      });
    tester.execute();

    describe('persists data across data service instances', () => {
      it('persists ratings across data service instances', async () => {
        const createService = () => SqliteEloDataService.createPersistentService('./sqlite-test.db', 'users', 'matches');

        let service = createService();
        service.deleteAllData();

        const user = SnowflakeUtil.generate();
        const server = SnowflakeUtil.generate();
        const rating = 123;

        service.setRating(user, server, rating);

        service.close();

        service = createService();

        expect(await service.getRating(user, server)).toBe(rating);
      });

      it('persists matches across data services instances', async () => {
        const createService = () => SqliteEloDataService.createPersistentService('./sqlite-test.db', 'users', 'matches');

        let service = createService();
        service.deleteAllData();

        const user1 = SnowflakeUtil.generate();
        const user2 = SnowflakeUtil.generate();
        const server = SnowflakeUtil.generate();
        const date = new Date();
        const winner = user1;
        const author = user2;

        service.addMatch(user1, user2, server, date, winner, author)

        service.close();

        service = createService();

        const matchHistory = await service.getMatchHistory(user1, user2, server);

        expect(matchHistory[0].date.getTime()).toBe(date.getTime());
        expect(matchHistory[0].author).toBe(author);
        expect(matchHistory[0].winner).toBe(winner);
      });
    });
  });
});
