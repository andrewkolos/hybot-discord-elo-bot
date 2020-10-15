
import { InMemoryEloDataService } from 'src/bot/data/in-memory-implementation/in-memory-data-service';
import { DataServiceTester } from '../data-service-tester';

describe(nameof<InMemoryEloDataService>(), () => {
  const tester = new DataServiceTester(() => new InMemoryEloDataService());
  tester.execute();
});
