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

export async function manifestoCreateCommand(): Promise<void> {
  const cwd = process.cwd();
  const paths = getPaths(cwd);
  if (!fs.existsSync(paths.root)) {
    logError('r2pde-ai not initialized. Run r2pde-ai init first.');
    return;
  }

  // Step 2 — Interactive prompts
  logInfo('The name of this manifesto. Should reflect the principle it establishes (e.g. UI Principles, Code Philosophy).');
  const name = await input({ message: 'Manifesto name:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Name is required' });
  logInfo('The area of the project this manifesto governs.');
  const scope = await select({ message: 'Scope:', choices: [
    { name: 'UI', value: 'ui' },
    { name: 'UX', value: 'ux' },
    { name: 'Code Philosophy', value: 'code-philosophy' },
    { name: 'Development Culture', value: 'development-culture' },
    { name: 'Other', value: 'other' }
  ] });
  logInfo('A brief summary of what this manifesto enforces and why it exists.');
  const description = await input({ message: 'Brief description:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Description is required' });
  const kebabName = toKebabCase(name);
  const filename = `${kebabName}.md`;
  const filePath = path.join(paths.manifestos, filename);

  // Step 3 — Check for duplicates
  if (fs.existsSync(filePath)) {
    logWarn('Manifesto already exists.');
    logInfo('Select Yes to overwrite the existing manifesto file.');
    const overwrite = await confirm({ message: 'Manifesto already exists. Overwrite?', default: false });
    if (!overwrite) {
      logInfo('Operation cancelled.');
      return;
    }
  }

  // Step 4 — Generate manifesto file
  const templatePath = path.join(paths.templates, 'manifesto.template.md');
  if (!fs.existsSync(templatePath)) {
    logError('Manifesto template not found.');
    return;
  }
  let template = fs.readFileSync(templatePath, 'utf8');
  template = template.replace('[Name]', name);
  const meta = `---\nname: ${name}\nscope: ${scope}\ndescription: ${description}\ncreatedAt: ${new Date().toISOString()}\n---\n\n`;
  const content = meta + template;
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });

  // Step 5 — Update pde.index.md
  if (fs.existsSync(paths.index)) {
    let indexContent = fs.readFileSync(paths.index, { encoding: 'utf8' });
    const manifestosSection = '- Manifestos: .r2pde-ai/manifestos/';
    const newLine = `  - ${name}: .r2pde-ai/manifestos/${filename}`;
    if (indexContent.includes(manifestosSection)) {
      const lines = indexContent.split('\n');
      const idx = lines.findIndex(l => l.trim() === manifestosSection);
      if (idx !== -1) {
        // Insert after Manifestos: section, but before next section or end
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
  const logLine = `- ${new Date().toISOString()} | manifesto:create | ${filename} | created\n`;
  fs.ensureFileSync(logPath);
  fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });

  // Step 7 — Git commit if enabled
  const config = loadConfig(cwd);
  gitAddAndCommit(cwd, `feat(manifesto): add ${name}`, config);

  // Step 8 — Final output
  logSuccess(`Manifesto '${name}' created at .r2pde-ai/manifestos/${filename}`);
}
