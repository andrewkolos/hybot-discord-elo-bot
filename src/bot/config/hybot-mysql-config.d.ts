import { HyBotConfig } from './hybot-config';

export interface HyBotMySqlConfig extends HyBotConfig {
  sql: {
    connectionInfo: {
      host: string,
      port: number,
      database: string,
      user: string,
      password: string,
    },
    userTableName: string,
    matchTableName: string,
  }
}