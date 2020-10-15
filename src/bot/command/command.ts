import { Message } from 'discord.js';

/**
 * A bot command that can be used for users to perform bot actions.
 */
export interface Command {
  readonly name: string;
  readonly helpInfo?: CommandHelpInfo;
  readonly action: (message: Message, args: string[]) => Promise<void>;
}

/**
 * The specification for a bot command argument.
 */
export interface CommandArgSpec {
  readonly name: string;
  readonly description: string;
}

/**
 * Contains information used to generate a help message explaining what the command
 * does and how to use it.
 */
export interface CommandHelpInfo {
  readonly description: string;
  readonly argSpecs: ReadonlyArray<CommandArgSpec>;
  readonly examples: ReadonlyArray<string>;
}
