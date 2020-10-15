import { Command, CommandHelpInfo } from '../command';
import dedent = require('dedent');
import { Message, RichEmbed } from 'discord.js';
import { CommandSource } from '../command-source';

/**
 * A command that explains what other commands do and how to use them.
 */
export class Help implements Command {
  public constructor(private readonly prefix: string, private readonly commands: CommandSource, private readonly exclusionList: ReadonlyArray<string>) {}

  public readonly name = 'help';

  public readonly helpInfo: CommandHelpInfo = {
    description: 'Gets a list of commands, or provides info on a specific info command.',
    argSpecs: [
      {
        name: 'command_name',
        description: 'If given, I will retrieve information for this command. If not given, I will give you a list of commands.'
      }
    ],
    examples: [],
  };

  public async action(message: Message, args: string[]) {
    const channel = message.channel;

    const commands = this.commands();

    if (args.length === 0) {
      const names = commands.map(c => c.name).filter(name => !this.exclusionList.includes(name))
                                                          .map(name => `\`${name}\``);
      channel.send(dedent`Available commands: ${names.join(', ')}.
                          Type \`${this.prefix + this.name}\` followed by the name of any command to see how to use it.`);
    } else {
      const nameOfCommandInQuestion = args[0];
      const command = commands.find(c => c.name === nameOfCommandInQuestion);

      if (command == null) {
        channel.send(`Didn't find a command with a name of *${nameOfCommandInQuestion}*.`);
      } else {
        const helpInfo = command.helpInfo;
        if (helpInfo == null) {
          channel.send('There is no help information for this command.');
        } else {
          channel.send(this.buildHelpEmbed(command.name, helpInfo));
        }
      }
    }
  }

  /**
   * Builds a pretty-looking embed that contains the help information.
   * @param name The name of the command.
   * @param info The command's help information.
   */
  private buildHelpEmbed(name: string, info: CommandHelpInfo): RichEmbed {

    let embed = new RichEmbed()
      .setTitle(`Command Description for: ${name}`)
      .setDescription(info.description)

    embed.addField('Format', this.prefix + [name].concat(info.argSpecs.map(cas => `*${cas.name}*`)).join(' '));

    if (info.argSpecs != null && info.argSpecs.length > 0) {
      const nameAndDescStrings = info.argSpecs.map(cas => `*${cas.name}* => ${cas.description}`);
      embed = embed.addField('Arguments', nameAndDescStrings.join('\n'));
    }

    if (info.examples != null && info.examples.length > 0) {
      embed = embed.addField('Examples', info.examples.join('\n'));
    }

    return embed;
  }
}
