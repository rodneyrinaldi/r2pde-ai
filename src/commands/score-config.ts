import { Command } from 'commander';
import { loadConfig, saveConfig } from '../core/config.js';
import { logInfo, logSuccess, logError } from '../core/logger.js';
import { input } from '@inquirer/prompts';

export const scoreConfigCommand = new Command('score:config')
  .description('Configure quality score thresholds')
  .action(async () => {
    const cwd = process.cwd();
    const config = loadConfig(cwd);
    logInfo(`Current thresholds:`);
    logInfo(`  Green max % issues: ${config.score.green.max}`);
    logInfo(`  Yellow max % issues: ${config.score.yellow.max}`);
    logInfo('Maximum percentage of issues allowed for a GREEN score. Below this = healthy project.');
    const green = Number(await input({ message: 'Green threshold max % of issues:', default: String(config.score.green.max), validate: (v: string) => {
      const n = Number(v);
      return n >= 1 && n < 100 ? true : 'Enter a value between 1 and 99';
    }}));
    logInfo('Maximum percentage of issues allowed for a YELLOW score. Above this = RED.');
    const yellow = Number(await input({ message: 'Yellow threshold max % of issues:', default: String(config.score.yellow.max), validate: (v: string) => {
      const n = Number(v);
      return n > green && n < 100 ? true : 'Yellow must be greater than green and less than 100';
    }}));
    if (green >= yellow) {
      logError('Green threshold must be less than yellow threshold.');
      return;
    }
    config.score.green.max = green;
    config.score.yellow.max = yellow;
    saveConfig(cwd, config);
    logSuccess(`Updated thresholds: green.max=${green}, yellow.max=${yellow}`);
  });
