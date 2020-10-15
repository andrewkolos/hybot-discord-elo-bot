import { Message } from 'discord.js';

export interface CommandMessageParts {
  commandName: string;
  args: string[];
}

/**
 * Parses a bot command message. Assume the message is a valid bot command (starts with bot prefix).
 * @param prefix Prefix that indicates the message is intended for the bot.
 * @param message The message for the bot to respond to.
 */
export function parseCommand(prefix: string, message: Message): CommandMessageParts | undefined {
  if (!message.content.startsWith(prefix)) {
    throw new Error(`Cannot parse message. Message must begin with configured prefix "${prefix}"`);
  }

  const words: string[] = message.content.slice(prefix.length).trim().split(/ +/g);

  if (words.length === 0) return undefined;

  const commandName = words[0].toLowerCase();
  const args = words.splice(1);
  const parts: CommandMessageParts = { commandName, args };
  return parts;
}
