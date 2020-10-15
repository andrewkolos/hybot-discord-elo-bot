import { HyBot } from './bot/hybot';
import { EloDataService } from './bot/data/elo-data-service';
import { GetRating, GetTop, Ping, Record, Roll, Timer } from './bot/command/commands';
import { Help } from './bot/command/commands/help';
import { botConfig } from './config/bot-config';
import { dbConfig } from './config/db-config';
import { SqliteEloDataService } from './bot/data/sql/sqlite-implementation/sqlite-data-service';

async function start() {
  const dataService = await SqliteEloDataService.createPersistentService({
    filePath: dbConfig.dbFilename,
    matchTableName: 'matches',
    userTableName: 'users',
  });
  startBot(dataService);
}

async function startBot(dataService: EloDataService) {
  const bot = new HyBot(botConfig);
  bot.registerCommand(new GetRating(botConfig.prefix, dataService));
  bot.registerCommand(new Help(botConfig.prefix, () => bot.getCommands(), []));
  bot.registerCommand(new Ping());
  bot.registerCommand(new Record(botConfig.prefix, dataService));
  bot.registerCommand(new Roll(botConfig.prefix));
  bot.registerCommand(new Timer(botConfig.prefix));

  const client = await bot.connect();
  console.log(`Bot Client logged in as ${client.user.username}.`);

  bot.registerCommand(new GetTop(botConfig.prefix, dataService, client));
}

start().catch(errReason => console.log(errReason));
