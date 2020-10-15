import Discord, { Client } from 'discord.js';
import { HyBotConfig } from './hybot-config';
import { Command } from './command/command';
import { CommandMessageParts, parseCommand } from './command/message-parser';

export class HyBot {

  private client?: Discord.Client;
  private readonly commandsByName = new Map<string, Command>();

  /**
   * Creates an instance of HyBot, ready to connect.
   * @param config The configuration for the bot.
   */
  public constructor(private config: HyBotConfig) { }

  /**
   * Creates a Discord client for the bot to use using the
   * credentials defined in the configuration.
   * @returns connect The bot's client.
   */
  public async connect(): Promise<Client> {
    const client = new Discord.Client(this.config.clientConfig);
    await client.login(this.config.token);
    this.client = client;
    client.on('message', this.processMessage.bind(this));

    return client;
  }

  /**
   * Determines if the bot's discord client exists and is logged in and ready.
   * @returns `true` if connected, `false` otherwise.
   */
  public isConnected(): boolean {
    if (this.client == null) {
      return false;
    } else {
      return this.client.status === (Discord as any).Constants.Status.READY;
    }
  }

  /**
   * Disconnects the client if it is connected.
   */
  public disconnect() {
    if (this.client != null) this.client.destroy();
  }

  /**
   * Adds a command to this registry.
   * @param command The command to add.
   */
  public registerCommand(command: Command | Command[]) {
    if (!Array.isArray(command)) {
      command = Array(command);
    }

    command.forEach(c => this.commandsByName.set(c.name, c));
  }

  /**
   * Removes a command from this registry.
   * @param command The `Command` to remove.
   */
  public unregisterCommand(command: Command | Command[]) {
    if (!Array.isArray(command)) {
      command = Array(command);
    }

    command.forEach(c => this.commandsByName.delete(c.name));
  }

  /**
   * Gets the `Command`s registered.
   */
  public getCommands(): Command[] {
    return [...this.commandsByName.values()];
  }

  /**
   * Processes a message sent by another user. The if the message is a bot command, the bot
   * will execute the command or notify the user that the command was written incorrectly by
   * sending a message to the same channel as the processed message.
   * @param message The message to process.
   */
  private processMessage(message: Discord.Message) {
    if (this.client == null || this.client.status === (Discord as any).Constants.Status.DISCONNECTED) {
      throw new Error('Attempted to process a message without a connected client.');
    }
    if (!this.isMessageIntendedForBot(message)) return;

    const messageParts: CommandMessageParts | undefined =
      parseCommand(this.config.prefix, message);

    if (messageParts == null) return;

    const command: Command | undefined = this.commandsByName.get(messageParts.commandName);

    if (command == null) {
      message.channel.send(`There is no *${messageParts.commandName}* command.`);
    } else {
      command.action(message, messageParts.args).catch(err => {

        // We don't necessarily want to crash the program here, but we should notify the user that
        // an error ocurred. The bot owner can look at the log for the error information.
        message.channel.send('Sorry, something went wrong.');
        console.log(err);
      });
    }
  }

  private isMessageIntendedForBot(message: Discord.Message) {
    return message.content.startsWith(this.config.prefix);
  }
}
