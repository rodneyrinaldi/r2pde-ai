import { select, confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { getPaths } from '../core/paths.js';
import { logError, logWarn, logInfo, logSuccess } from '../core/logger.js';
import { gitAddAndCommit } from '../core/git.js';
import { loadConfig } from '../core/config.js';

export async function manifestoDeleteCommand(): Promise<void> {
  const cwd = process.cwd();
  const paths = getPaths(cwd);
  if (!fs.existsSync(paths.root)) {
    logError('r2pde-ai not initialized. Run r2pde-ai init first.');
    return;
  }
  const files = fs.readdirSync(paths.manifestos).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    logInfo('No manifestos found.');
    return;
  }
  logInfo('Select the artifact to permanently delete. This action cannot be undone and will remove the file from disk.');
  const selected = await select({
    message: 'Select a manifesto to delete:',
    choices: files.map(f => ({ name: f.replace('.md', ''), value: f })),
  });
  const name = selected.replace(/\.md$/, '').replace(/-/g, ' ');
  logWarn('This action cannot be undone.');
  logInfo('Select Yes to confirm deletion.');
  const doDelete = await confirm({ message: `Delete manifesto '${name}'?`, default: false });
  if (!doDelete) {
    logInfo('Operation cancelled.');
    return;
  }
  const filePath = path.join(paths.manifestos, selected);
  fs.unlinkSync(filePath);
  // Step 5 — Log entry
  const logPath = path.join(paths.logs, 'pde.log.md');
  const logLine = `- ${new Date().toISOString()} | manifesto:delete | ${selected} | deleted\n`;
  fs.ensureFileSync(logPath);
  fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });
  // Step 6 — Git commit if enabled
  const config = loadConfig(cwd);
  gitAddAndCommit(cwd, `feat(manifesto): remove ${name}`, config);
  // Step 7 — Final output
  logSuccess(`Manifesto '${name}' deleted.`);
}
