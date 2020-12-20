import { getEnvVariableValue } from './getEnvVariableValue';

export const dbConfig = {
  host: getEnvVariableValue('DB_HOST'),
  port: process.env.DB_PORT == null ? 3306 : parseInt(process.env.DB_PORT!),
  database: getEnvVariableValue('DB_NAME'),
  user: getEnvVariableValue('DB_USER'),
  password: getEnvVariableValue('DB_PASSWORD'),
};
