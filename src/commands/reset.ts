import { Command } from 'commander';
import { getPaths } from '../core/paths.js';
import { logWarn, logSuccess, logInfo } from '../core/logger.js';
import fs from 'fs-extra';
import { confirm } from '@inquirer/prompts';
import path from 'path';

export const resetCommand = new Command('reset')
  .description('Clear the prompts folder')
  .action(async () => {
    const cwd = process.cwd();
    const paths = getPaths(cwd);
    if (!fs.existsSync(paths.root)) {
      logWarn('r2pde-ai not initialized. Run r2pde-ai init first.');
      return;
    }
    logWarn('This will delete all files in .r2pde-ai/prompts/. This action cannot be undone.');
    logInfo('This will permanently delete all generated prompts. Artifacts (manifestos, contracts, requirements) are NOT affected.');
    const doReset = await confirm({ message: 'Reset prompts folder?', default: false });
    if (!doReset) {
      logInfo('Operation cancelled.');
      return;
    }
    const promptDir = paths.prompts;
    if (fs.existsSync(promptDir)) {
      for (const file of fs.readdirSync(promptDir)) {
        fs.unlinkSync(path.join(promptDir, file));
      }
    }
    const logPath = path.join(paths.logs, 'pde.log.md');
    fs.ensureFileSync(logPath);
    fs.appendFileSync(logPath, `- ${new Date().toISOString()} | reset | prompts | cleared\n`, { encoding: 'utf8' });
    logSuccess('Prompts folder cleared.');
  });
