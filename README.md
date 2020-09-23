# HyBot Elo Tracking Bot For Discord

HyBot is a Node.js Discord bot created with the Discord.js framework. With HyBot, users can record matches with simple commands. Elo scores are updated automatically, and users can see Elo scores.
HyBot is decently modular, and new commands can be added easily by implementing the `Command` interface. HyBot was built primarily with Elo-tracking functionality in mind, but this can be ignored if desired.

# Using the Bot

Note: the below code snippets are adapted from the example implementation, which can be found at the top-level of the project.

## Bot Configuration
All HyBot *needs* is a configuration object implementing the `HyBotConfig` interface. Example:

```TypeScript
export const basicConfig: HyBotConfig = {
  token: 'NTAzNzU4NTM4NDE4NTUyODMy.DsAZgA.DU9XxTFbv_qAinykdbR_YIN9IHY', // The bot's user token.
  prefix: '$', // The prefix that bot commands. Commonly "!". For example, if the user wants to use the 'ping' command, they would type '!ping'.
  owners: ['368485403340046336'] // Optional. Specifies owners/admins that may have access to special commands, if implemented.
};
```

If you want to use the ELO tracking commands of HyBot, you need to supply a `EloDataService` implementation for the bot to use to store and retrieve user/match data. There are a couple of configurable implementations built-in:

* SQLite: Can be used to store data in the local file system or in-memory
* MySQL: A more full-fledged database with built-in network access

## Creating a MySQL Elo data service and starting the bot


### Create an instance of `MySqlEloDataService`
```TypeScript
import mysql from 'mysql';

async function createAndStartBot() {

  // We souldn't be storing database connection info in plaintext / in code, but
  // we do so in this example to keep things simple.
  const pool: mysql.Pool = mysql.createPool({
    connectionLimit: 10,
    connectTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    port: 3306,
    database: 'database-endpoint-url',
    user: 'root',
    password 'rootpassword',
  });

  const usersTableName = 'users';
  const matchTableName = 'matches';

  const createTablesIfNonexistent = true;

  const dataService = await MySqlEloDataService.createService(pool, usersTableName, matchTableName, createTablesIfNonexistent);

  // Code to start bot with our data service here...
}
```

### Creating and starting the bot with our data service
```TypeScript
// At the end of createAndStartBot...

// As you can see, all HyBot *needs* is the simple config discussed before the data service.
// The data service is simply used for the Elo-related built-in commands.
const bot = new HyBot(config);

// Here, we add all the built-in commands. The implementer is free to omit any of these commands
// and add their own.

bot.registerCommand(new GetRating(config.prefix, dataService));
bot.registerCommand(new Help(config.prefix, () => bot.getCommands(), []));
bot.registerCommand(new Ping());
bot.registerCommand(new Record(config.prefix, dataService));
bot.registerCommand(new Roll(config.prefix));
bot.registerCommand(new Timer(config.prefix));

const client: Discord.Client = await bot.connect();
console.log(`Bot Client logged in as ${client.user.username}.`);

bot.commandRegistry.registerCommand(new GetTop(config.prefix, dataService, client));
```

As stated before HyBot is modular and can be re-purposed into any kind of bot that's not necessarily be about tracking Elo scores. One would simply choose not to instantiate and register the built-in commands regarding Elo-tracking (and thus the need for a `EloDataService` is removed). If you are reading this and happen to be interesting in creating your own Discord bot, I suggest considering a more robust and well-documented framework such as `discord-akairo` (we have personally not tried it); though, of course, you are welcome to clone HyBot as well and re-purpose it to your own needs.

# Demo

The `help` command shows all commands registered to the instance of HyBot.
![Imgur](https://i.imgur.com/tfB3Z15.png)

Give `help` the name of another command to view it's help information.
![Imgur](https://i.imgur.com/LRmsu0w.png)

Use `getrating` to get a user's rating.

![Imgur](https://i.imgur.com/ZA3xXDW.png)

Use `record` followed by either `winvs` or `lossvs` and mention another user to record a match with them.

![Imgur](https://i.imgur.com/UA0nGtM.png)

Each user's Elo rating is updated automatically.

![Imgur](https://i.imgur.com/GqvCX8z.png)

# MIT License

Copyright (c) 2019 hylaster, Andrew Kolos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
