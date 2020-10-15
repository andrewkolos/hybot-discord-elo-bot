import Discord from 'discord.js';
import { EloDataService } from './data/elo-data-service';

export interface HyBotConfig {
  /** Token to be used for the client to login. */
  token: string;

  /**
   * The prefix of a message that indicates that
   */
  prefix: string;

  /**
   * The owning user(s) of the bot. These users can be given privilege needed to use secured bot commands.
   */
  owners: Discord.Snowflake[];

  /**
   * Option for the bot's client.
   */
  clientConfig: Discord.ClientOptions | undefined;
}

export interface MatchRecordingValidationContext {
  /** The user that's attempting to record the match. */
  author: Discord.User;
  /** One of the users that competed in the match. */
  user: Discord.User;
  /** The other user that competed in the match. */
  otherUser: Discord.User;
  /** The winner of the match. */
  winner: Discord.User;
  /** The server that the match took place on. */
  server: Discord.Guild;
  /** The chat channel that the author is trying to record the match in. */
  channel: Discord.Channel;
  /** The data service that the bot is using. */
  eloDataService: EloDataService;
}
