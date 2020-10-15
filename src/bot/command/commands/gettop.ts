import { Command, CommandHelpInfo } from '../command';
import { UserRatingPair, EloDataService } from '../../data/elo-data-service';
import { Client, Message } from 'discord.js';

export class GetTop implements Command {

  public readonly name = 'gettop';

  public readonly helpInfo: CommandHelpInfo = {
    description: "Get's a player's ranking.",
    argSpecs: [
      { name: 'User', description: 'A mention for the user (i.e. @ someone).' }
    ],
    examples: [`${this.prefix + this.name} @ELO Bot`]
  };

  public constructor(private prefix: string, private dataService: EloDataService, private client: Client) { }

  public async action(message: Message, _args: string[]) {
    const topUsers: UserRatingPair[] = await this.dataService.getTopNPlayers(message.guild.id, 2);
    const rankOne: UserRatingPair | undefined = topUsers[0];
    const rankTwo: UserRatingPair | undefined = topUsers[1];

    if (rankOne && rankTwo) {
      message.channel.send(`Top rating is ${this.client.users.get(rankOne.user)} at ${rankOne.rating}
                2nd place is ${this.client.users.get(rankTwo.user)} at ${rankTwo.rating}`);
    } else {
      message.channel.send('There are less than two users ranked..');
    }
  }
}
