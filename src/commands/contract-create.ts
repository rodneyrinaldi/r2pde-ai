import { input, select, confirm } from '@inquirer/prompts';
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

export async function contractCreateCommand(): Promise<void> {
  const cwd = process.cwd();
  const paths = getPaths(cwd);
  if (!fs.existsSync(paths.root)) {
    logError('r2pde-ai not initialized. Run r2pde-ai init first.');
    return;
  }

  // Step 2 — Interactive prompts
  logInfo('The name of this contract. Should reflect what rule it enforces (e.g. API Security, Commit Convention).');
  const name = await input({ message: 'Contract name:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Name is required' });
  logInfo('The category this contract belongs to. Used for organization and score evaluation.');
  const type = await select({ message: 'Type:', choices: [
    { name: 'Architecture', value: 'architecture' },
    { name: 'TDD', value: 'tdd' },
    { name: 'DDD', value: 'ddd' },
    { name: 'Security', value: 'security' },
    { name: 'Permissions', value: 'permissions' },
    { name: 'Routing', value: 'routing' },
    { name: 'Tests', value: 'tests' },
    { name: 'Commits', value: 'commits' },
    { name: 'Other', value: 'other' }
  ] });
  logInfo('Mandatory contracts are evaluated strictly. Recommended contracts generate warnings only.');
  const enforcement = await select({ message: 'Enforcement level:', choices: [
    { name: 'Mandatory', value: 'mandatory' },
    { name: 'Recommended', value: 'recommended' }
  ] });
  logInfo('A brief summary of what this contract enforces and the consequences of violation.');
  const description = await input({ message: 'Brief description:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Description is required' });
  const kebabName = toKebabCase(name);
  const filename = `${kebabName}.md`;
  const filePath = path.join(paths.contracts, filename);

  // Step 3 — Check for duplicates
  if (fs.existsSync(filePath)) {
    logWarn('Contract already exists.');
    logInfo('Select Yes to overwrite the existing contract file.');
    const overwrite = await confirm({ message: 'Contract already exists. Overwrite?', default: false });
    if (!overwrite) {
      logInfo('Operation cancelled.');
      return;
    }
  }

  // Step 4 — Generate contract file
  const templatePath = path.join(paths.templates, 'contract.template.md');
  if (!fs.existsSync(templatePath)) {
    logError('Contract template not found.');
    return;
  }
  let template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  template = template.replace('[Name]', name);
  const meta = `---\nname: ${name}\ntype: ${type}\nenforcement: ${enforcement}\ndescription: ${description}\ncreatedAt: ${new Date().toISOString()}\n---\n\n`;
  const content = meta + template;
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });

  // Step 5 — Update pde.index.md
  if (fs.existsSync(paths.index)) {
    let indexContent = fs.readFileSync(paths.index, { encoding: 'utf8' });
    const contractsSection = '- Contracts: .r2pde-ai/contracts/';
    const newLine = `  - ${name}: .r2pde-ai/contracts/${filename}`;
    if (indexContent.includes(contractsSection)) {
      const lines = indexContent.split('\n');
      const idx = lines.findIndex(l => l.trim() === contractsSection);
      if (idx !== -1) {
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
  const logLine = `- ${new Date().toISOString()} | contract:create | ${filename} | created\n`;
  fs.ensureFileSync(logPath);
  fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });

  // Step 7 — Git commit if enabled
  const config = loadConfig(cwd);
  gitAddAndCommit(cwd, `feat(contract): add ${name}`, config);

  // Step 8 — Final output
  logSuccess(`Contract '${name}' created at .r2pde-ai/contracts/${filename}`);
}
