import { Command, CommandHelpInfo } from '../command';
import { Message, Snowflake } from 'discord.js';
import { EloDataService } from '../../data/elo-data-service';
import dedent from 'dedent';

export class ResetRank implements Command {

  public readonly name = 'resetrank';

  public readonly helpInfo: CommandHelpInfo = {
    description: dedent`Resets a player's rank. Can only
      be used by one of the authorized users: `,
    argSpecs: [
      { name: 'user', description: `player that will have their rank reset.` },
    ],
    examples: [
      `*${this.commandPrefix + this.name} @SomeUser*`,
    ],
  };
  public constructor(private commandPrefix: string, private authorizedUsers: Snowflake[],
              private dataService: EloDataService) {}

  public async action(message: Message, _args: string[]) {
    if (this.authorizedUsers.includes(message.author.id)) {
      message.channel.send('Only a bot owner may reset a player\'s ranking.');
      return;
    }

    const member = message.mentions.members.first().user;
    if (!member) {
      message.channel.send('Please tag a user.');
    } else {
      const user = member.id;
      const server = message.guild.id;

      const userIsRated = await this.dataService.isUserRated(user, server);
      const newUserRating = 1000;

      if (userIsRated) {
        this.dataService.setRating(user, server, newUserRating).then(() => {
          message.channel.send(`Ranking reset to ${newUserRating}`);
        });
      } else {
        message.channel.send('User is not rated.');
      }
    }
  }
}
