import { Command, CommandHelpInfo } from '../command';
import { getRatingOrDefault } from '../shared/getRatingOrDefault';
import { Message } from 'discord.js';
import { DataService } from 'src/data/data-service';

export class GetRating implements Command {

  constructor(private prefix: string, private dataService: DataService) {}

  name = 'getrating';

  helpInfo: CommandHelpInfo = {
    description: "Get's a player's ranking.",
    argSpecs: [
      { name: 'User', description: 'A mention for a user them (i.e. @ someone).' }
    ],
    examples: [`${this.prefix + this.name} @ELO Bot`]
  };

  async execute(message: Message, _args: string[]) {

    const firstMention = message.mentions.members.first();

    if (firstMention == null) {
      message.channel.send('Specify who your opponent was by mentioning your opponent as the second argument (e.g. @MyOpponent)');
      return;
    }

    const user = firstMention.user;
    const serverId = message.guild.id;
    const rating = await getRatingOrDefault(user.id, serverId, this.dataService);

    message.channel.send(`${user.username}'s rating is ${rating}.`);
  }

}