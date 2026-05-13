import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import { loadConfig, saveConfig } from '../core/config.js';
import { logInfo, logSuccess } from '../core/logger.js';

export const configLangCommand = new Command('config:lang')
  .description('Set language for messages and artifacts')
  .action(async () => {
    const cwd = process.cwd();
    const config = loadConfig(cwd);
    logInfo('The language for all CLI output messages.');
    const language = await select({
      message: 'Language for CLI messages:',
      choices: [
        { name: 'English', value: 'en' },
        { name: 'Português', value: 'pt' }
      ],
      default: (config.language as 'en' | 'pt') || 'en',
    });
    logInfo('The language used when generating markdown artifact files.');
    const artifactsLanguage = await select({
      message: 'Language for artifacts:',
      choices: [
        { name: 'English', value: 'en' },
        { name: 'Português', value: 'pt' }
      ],
      default: (config.artifactsLanguage as 'en' | 'pt') || 'en',
    });
    config.language = language;
    config.artifactsLanguage = artifactsLanguage;
    saveConfig(cwd, config);
    logSuccess('Language settings updated.');
  });

