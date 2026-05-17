import { input, select, confirm } from '@inquirer/prompts';
import process from 'process';
import fs from 'fs-extra';
import path from 'path';
import { getPaths } from '../core/paths.js';
import { logError, logWarn, logInfo, logSuccess } from '../core/logger.js';
import { gitAddAndCommit } from '../core/git.js';
import { loadConfig } from '../core/config.js';

function toKebabCase(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function manifestCreateCommand(): Promise<void> {
  // Suporte a flags para automação
  const argv = process.argv.slice(2);
  function getFlag(flag: string): string | undefined {
    const idx = argv.findIndex(a => a === flag);
    if (idx !== -1 && argv.length > idx + 1) return argv[idx + 1];
    return undefined;
  }
  const flagName = getFlag('--name');
  const flagScope = getFlag('--scope');
  const flagDescription = getFlag('--description');
  const flagType = getFlag('--type');
  const flagForce = argv.includes('--force');
  const cwd = process.cwd();
  const paths = getPaths(cwd);
  if (!fs.existsSync(paths.root)) {
    logError('r2pde-ai not initialized. Run r2pde-ai init first.');
    return;
  }

  // Step 2 — Interactive prompts
  let name = flagName;
  let scope = flagScope;
  let description = flagDescription;
  let changeType = flagType;

  if (!name) {
    logInfo('The name of this manifest. Should reflect the principle it establishes (e.g. UI Principles, Code Philosophy).');
    name = await input({ message: 'manifest name:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Name is required' });
  }
  if (!scope) {
    logInfo('The area of the project this manifest governs.');
    scope = await select({ message: 'Scope:', choices: [
      { name: 'UI', value: 'ui' },
      { name: 'UX', value: 'ux' },
      { name: 'Code Philosophy', value: 'code-philosophy' },
      { name: 'Development Culture', value: 'development-culture' },
      { name: 'Other', value: 'other' }
    ] });
  }
  if (!description) {
    logInfo('A brief summary of what this manifest enforces and why it exists.');
    description = await input({ message: 'Brief description:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Description is required' });
  }
  if (!changeType) {
    logInfo('Select the type of change for this manifest:');
    changeType = await select({
      message: 'Change type:',
      choices: [
        { name: 'feat (new principle or feature)', value: 'feat' },
        { name: 'fix (correction or bugfix)', value: 'fix' },
        { name: 'improve (refinement or enhancement)', value: 'improve' }
      ]
    });
  }
  const kebabName = toKebabCase(name);
  const filename = `${kebabName}.md`;
  const filePath = path.join(paths.manifests, filename);

  // Step 3 — Check for duplicates
  if (fs.existsSync(filePath)) {
    if (flagForce) {
      logWarn('manifest already exists. Overwriting due to --force flag.');
    } else {
      logWarn('manifest already exists.');
      logInfo('Select Yes to overwrite the existing manifest file.');
      const overwrite = await confirm({ message: 'manifest already exists. Overwrite?', default: false });
      if (!overwrite) {
        logInfo('Operation cancelled.');
        return;
      }
    }
  }

  // Step 4 — Generate manifest file
  const templatePath = path.join(paths.templates, 'manifest.template.md');
  if (!fs.existsSync(templatePath)) {
    logError('manifest template not found.');
    return;
  }
  let template = fs.readFileSync(templatePath, 'utf8');
  // Substituir todos os placeholders do template
  template = template.replace(/\{\{name\}\}/gi, name)
                   .replace(/\{\{scope\}\}/gi, scope)
                   .replace(/\{\{description\}\}/gi, description)
                   .replace(/\{\{changeType\}\}/gi, changeType)
                   .replace(/\{\{createdAt\}\}/gi, new Date().toISOString());
  fs.writeFileSync(filePath, template, { encoding: 'utf8' });

  // Step 5 — Update pde.index.md
  if (fs.existsSync(paths.index)) {
    let indexContent = fs.readFileSync(paths.index, { encoding: 'utf8' });
    const manifestsSection = '- manifests: .r2pde-ai/manifests/';
    const newLine = `  - ${name}: .r2pde-ai/manifests/${filename}`;
    if (indexContent.includes(manifestsSection)) {
      const lines = indexContent.split('\n');
      const idx = lines.findIndex(l => l.trim() === manifestsSection);
      if (idx !== -1) {
        // Insert after manifests: section, but before next section or end
        let insertAt = idx + 1;
        while (insertAt < lines.length && (lines[insertAt].startsWith('  - ') || lines[insertAt].trim() === '')) insertAt++;
        lines.splice(insertAt, 0, newLine);
        indexContent = lines.join('\n');
        fs.writeFileSync(paths.index, indexContent, { encoding: 'utf8' });
      }
    }
  } else {
    logWarn('pde.index.md not found. Skipping index update.');
  }

  // Step 6 — Log entry
  const logPath = path.join(paths.logs, 'pde.log.md');
  const logLine = `- ${new Date().toISOString()} | manifest:create | ${filename} | created\n`;
  fs.ensureFileSync(logPath);
  fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });

  // Step 7 — Git commit if enabled
  const config = loadConfig(cwd);
  gitAddAndCommit(cwd, `feat(manifest): add ${name}`, config);

  // Step 8 — Final output
  logSuccess(`manifest '${name}' created at .r2pde-ai/manifests/${filename}`);
}
