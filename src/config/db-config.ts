import { getEnvVariableValue } from './getEnvVariableValue';

export const dbConfig = {
  dbFilename: getDbFilename(),
};

function getDbFilename(): string {
  const ext = '.db';
  const raw = getEnvVariableValue('DB_FILENAME');
  const noExt = raw.endsWith(ext) ? raw.substr(0, raw.lastIndexOf(ext)) : raw;
  return noExt + ext;
}
