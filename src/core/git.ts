import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { PdeConfig } from './config.js';
import { logWarn } from './logger.js';

export function isGitRepo(projectRoot: string): boolean {
  return fs.existsSync(path.resolve(projectRoot, '.git'));
}

export function gitAddAndCommit(projectRoot: string, message: string, config: PdeConfig): void {
  if (!config.git.autoCommit) return;
  if (!isGitRepo(projectRoot)) return;
  try {
    execSync('git add .r2pde-ai/', { cwd: projectRoot, stdio: 'ignore' });
    execSync(`git commit -m "${config.git.commitMessagePrefix} ${message}"`, { cwd: projectRoot, stdio: 'ignore' });
  } catch {
    logWarn('Git commit failed (ignored).');
  }
}
