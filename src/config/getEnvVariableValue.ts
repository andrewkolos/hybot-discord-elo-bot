export function getEnvVariableValue(variableName: string): string {
  const value = process.env[variableName];
  if (value != null)
    return value;
  throw Error(`${variableName} is not defined in the process environment.`);
}
