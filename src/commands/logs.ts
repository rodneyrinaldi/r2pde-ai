import { Command } from 'commander';
import { getPaths } from '../core/paths.js';
import { logInfo, logSuccess, logWarn } from '../core/logger.js';
import fs from 'fs-extra';
import { confirm } from '@inquirer/prompts';
import path from 'path';

export const logsCommand = new Command('logs')
  .description('View the audit log')
  .option('--clear', 'Clear all logs')
  .action(async (opts) => {
    const cwd = process.cwd();
    const paths = getPaths(cwd);
    if (!fs.existsSync(paths.root)) {
      logWarn('r2pde-ai not initialized. Run r2pde-ai init first.');
      return;
    }
    const logPath = path.join(paths.logs, 'pde.log.md');
    if (opts.clear) {
      logInfo('This will permanently delete all audit log entries. This action cannot be undone.');
      const doClear = await confirm({ message: 'Clear all logs? This cannot be undone.', default: false });
      if (!doClear) {
        logInfo('Operation cancelled.');
        return;
      }
      fs.writeFileSync(logPath, '', { encoding: 'utf8' });
      logSuccess('Logs cleared.');
      return;
    }
    if (!fs.existsSync(logPath)) {
      logInfo('No logs found.');
      return;
    }
    const content = fs.readFileSync(logPath, 'utf8');
    logInfo('\n' + content);
  });
