import { Command } from 'commander';
import { scoreProject } from '../core/scorer.js';
import { getPaths } from '../core/paths.js';
import { logError, logWarn, logInfo, logSuccess } from '../core/logger.js';
import { loadConfig } from '../core/config.js';
import fs from 'fs-extra';
import path from 'path';

export const scoreCommand = new Command('score')
  .description('Evaluate quality score from current or specified context')
  .option('--from <folder>', 'Evaluate from this folder (manifests | contracts | requirements)')
  .action(async (opts) => {
    const cwd = process.cwd();
    const paths = getPaths(cwd);
    if (!fs.existsSync(paths.root)) {
      logError('r2pde-ai not initialized. Run r2pde-ai init first.');
      return;
    }
    const config = loadConfig(cwd);
    const result = scoreProject(cwd, opts.from);
    for (const warn of result.warnings) {
      if (warn.severity === 'error') logError(`[${warn.file}] ${warn.issue}`);
      else logWarn(`[${warn.file}] ${warn.issue}`);
    }
    logInfo(`\nChecks: ${result.passed}/${result.total} passed, ${result.failed} failed`);
    logInfo(`Score: ${result.percentage}%`);
    let emoji = '🟢', msg = 'Score is GREEN — environment is consistent, proceed.';
    if (result.level === 'yellow') {
      emoji = '🟡';
      msg = 'Score is YELLOW — gaps detected, proceed with awareness.';
    } else if (result.level === 'red') {
      emoji = '🔴';
      msg = 'Score is RED — critical issues found, resolve before proceeding.';
    }
    logInfo(`${emoji} ${msg}`);
    // Log
    const logPath = path.join(paths.logs, 'pde.log.md');
    const logLine = `- ${new Date().toISOString()} | score | [${result.level}] | [${result.percentage}%] | [${result.passed}/${result.total}] checks passed\n`;
    fs.ensureFileSync(logPath);
    fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });
  });
