import { HyBotConfig } from '../bot/hybot-config';
import dotenv from 'dotenv';
import { getEnvVariableValue } from './getEnvVariableValue';

dotenv.config();

const envVariableNames = {
  token: 'HYBOT_TOKEN',
  owners: 'OWNERS',
};

export const botConfig: HyBotConfig = {
  token: getEnvVariableValue(envVariableNames.token),
  prefix: '!',
  owners: getOwners(),
  clientConfig: {},
};

function getOwners(): string[] {
  return getEnvVariableValue(envVariableNames.owners).split(',');
}
