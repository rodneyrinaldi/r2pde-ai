import chalk from 'chalk';

export function logSuccess(message: string): void {
  console.log(chalk.green('✔'), message);
}

export function logInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function logWarn(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function logError(message: string): void {
  console.log(chalk.red('✖'), message);
}

export function logScore(level: 'green' | 'yellow' | 'red', message: string): void {
  const emoji = level === 'green' ? '🟢' : level === 'yellow' ? '🟡' : '🔴';
  let colorFn = chalk.green;
  if (level === 'yellow') colorFn = chalk.yellow;
  if (level === 'red') colorFn = chalk.red;
  console.log(colorFn(emoji), message);
}
