import { HyBotConfig } from './bot/config/hybot-config';
import dotenv from 'dotenv';

dotenv.config();

const envVariableNames = {
  token: 'HYBOT_TOKEN',
  owners: 'OWNERS',
};

export const config: HyBotConfig = {
  token: getEnvVariableValue(envVariableNames.token),
  prefix: '!',
  owners: getOwners(),
  clientConfig: {},
};

function getOwners(): string[] {
  return getEnvVariableValue(envVariableNames.owners).split(',');
}

function getEnvVariableValue(variableName: string): string {
  const value = process.env[variableName];
  if (value != null) return value;
  throw Error(`${variableName} is not defined in the process environment.`);
}
