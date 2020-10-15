import { Command, CommandHelpInfo } from '../command';
import { TextChannel, DMChannel, GroupDMChannel, Message } from 'discord.js';

export class Roll implements Command {

  public readonly name = 'roll';

  public readonly helpInfo: CommandHelpInfo = {
    description: 'Rolls some number of dice, with an optional +/- modifier.',
    argSpecs: [
      { name: 'dice string', description: 'Specifies the number of dice to roll, the number of faces each has, ' +
                                          'and the modifier.' }
    ],
    examples: [
      `${this.prefix + this.name}3d6+4 => rolls three six-sided dice, and adds 4 to the result.`,
      `${this.prefix + this.name}*2d4-3* => rolls two four-sided dice, and substracts 3 from the result.`,
    ]
  };

  constructor(private prefix: string) { }

  public async action(message: Message, args: string[]) {
    if (args.length < 1) {
      this.sendInvalidArgsString(message.channel);
      return;
    }

    const dieRegex: RegExp = /(\d+)d(\d+)([+-]\d+)?/;

    const diceString = args.join('').trim(); // to allow for optional spaces in dice string

    const matches = diceString.match(dieRegex);

    if (matches == null) {
      this.sendInvalidArgsString(message.channel);
      return;
    }

    const numDice = parseInt(matches[1]);
    const numFaces = parseInt(matches[2]);
    const modifier = (matches[3] != null) ? parseInt(matches[3]) : 0;

    const results: number[] = [];
    let total = Number(modifier);
    for (let die = 0; die < numDice; die++) {
      const n = Math.floor(Math.random() * numFaces + 1);
      results.push(n);
      total += n;
    }

    let resultsMessage = `Results: ${ results.join(', ')}`;
    resultsMessage += `\nTotal${modifier === 0 ? '' : ' With Modifier'}: **${total}**`;

    message.channel.send(resultsMessage);
  }

  private sendInvalidArgsString = (channel: TextChannel | DMChannel | GroupDMChannel) => {
    channel.send('When using this command, also provide a valid dice string. Examples include 3d6, 2d4+3, 6d4-6');
  }
}
