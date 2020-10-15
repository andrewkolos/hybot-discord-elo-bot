import { Command, CommandHelpInfo } from '../command';
import { Message } from 'discord.js';

export class Timer implements Command {

  public readonly name = 'timer';

  public readonly helpInfo: CommandHelpInfo = {
    description: 'Set an *n*-second timer.',
    argSpecs: [
      { name: 'length in seconds', description: 'Number of seconds until your timer will go off.' }
    ],
    examples: [
      `${this.prefix + this.name} 30 => starts a 30 second timer`,
      `${this.prefix + this.name} 300 => starts a 5 minute timer`
    ]
  };

  public constructor(private prefix: string) { }

  public async action(message: Message, args: string[]) {
    const time = Number(args[0]) * 1000;
    const author = message.author;
    setTimeout(() => {
      message.channel.send(`${author}'s timer of length ${args[0]} seconds has reached zero.`);
    }, time);
  }
}
