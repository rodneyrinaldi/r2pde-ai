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

export async function requirementCreateCommand(): Promise<void> {
  const argv = process.argv;
  function getFlag(flag: string) {
    const idx = argv.indexOf(`--${flag}`);
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    return undefined;
  }
  const flagForce = argv.includes('--force');
  let name = getFlag('name');
  let type = getFlag('type');
  let priority = getFlag('priority');
  let description = getFlag('description');
  let changeType = getFlag('changeType');
  let criteria = getFlag('acceptance');

  if (!name) {
    logInfo('The name of this requirement. Should be clear and specific (e.g. User Registration, Password Reset).');
    name = await input({ message: 'Requirement name:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Name is required' });
  }
  if (!type) {
    logInfo('Functional requirements describe behavior. Non-functional describe quality. Business rules describe constraints.');
    type = await select({ message: 'Type:', choices: [
      { name: 'Functional', value: 'functional' },
      { name: 'Non-functional', value: 'non-functional' },
      { name: 'Business rule', value: 'business-rule' }
    ] });
  }
  if (!priority) {
    logInfo('High priority requirements are evaluated first in the quality score.');
    priority = await select({ message: 'Priority:', choices: [
      { name: 'High', value: 'high' },
      { name: 'Medium', value: 'medium' },
      { name: 'Low', value: 'low' }
    ] });
  }
  if (!description) {
    logInfo('A clear, objective description of what this requirement specifies.');
    description = await input({ message: 'Brief description:', validate: (inputVal: string) => inputVal.trim() !== '' || 'Description is required' });
  }
  if (!changeType) {
    logInfo('Select the type of change for this requirement:');
    changeType = await select({
      message: 'Change type:',
      choices: [
        { name: 'feat (new requirement or rule)', value: 'feat' },
        { name: 'fix (correction or bugfix)', value: 'fix' },
        { name: 'improve (refinement or enhancement)', value: 'improve' }
      ]
    });
  }
  if (!criteria) {
    logInfo('The conditions that must be true for this requirement to be considered complete. Comma-separated.');
    criteria = await input({ message: 'Acceptance criteria (comma-separated):', validate: (inputVal: string) => inputVal.trim() !== '' || 'Acceptance criteria required' });
  }
  const kebabName = toKebabCase(name);
  const filename = `${kebabName}.md`;
  const cwd = process.cwd();
  const paths = getPaths(cwd);
  const filePath = path.join(paths.requirements, filename);
  if (!fs.existsSync(paths.root)) {
    logError('r2pde-ai not initialized. Run r2pde-ai init first.');
    return;
  }



  // Step 3 — Check for duplicates
  if (fs.existsSync(filePath)) {
    if (flagForce) {
      logWarn('Requirement already exists. Overwriting due to --force flag.');
    } else {
      logWarn('Requirement already exists.');
      logInfo('Select Yes to overwrite the existing requirement file.');
      const overwrite = await confirm({ message: 'Requirement already exists. Overwrite?', default: false });
      if (!overwrite) {
        logInfo('Operation cancelled.');
        return;
      }
    }
  }

  // Step 4 — Generate requirement file
  const templatePath = path.join(paths.templates, 'requirement.template.md');
  if (!fs.existsSync(templatePath)) {
    logError('Requirement template not found.');
    return;
  }
  let template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  // Substituir todos os placeholders do template
  template = template.replace(/\{\{name\}\}/gi, name)
                   .replace(/\{\{type\}\}/gi, type)
                   .replace(/\{\{priority\}\}/gi, priority)
                   .replace(/\{\{description\}\}/gi, description)
                   .replace(/\{\{changeType\}\}/gi, changeType)
                   .replace(/\{\{criteria\}\}/gi, criteria)
                   .replace(/\{\{createdAt\}\}/gi, new Date().toISOString());
  fs.writeFileSync(filePath, template, { encoding: 'utf8' });

  // Step 5 — Update pde.index.md
  if (fs.existsSync(paths.index)) {
    let indexContent = fs.readFileSync(paths.index, { encoding: 'utf8' });
    const requirementsSection = '- Requirements: .r2pde-ai/requirements/';
    const newLine = `  - ${name}: .r2pde-ai/requirements/${filename}`;
    if (indexContent.includes(requirementsSection)) {
      const lines = indexContent.split('\n');
      const idx = lines.findIndex(l => l.trim() === requirementsSection);
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
  const logLine = `- ${new Date().toISOString()} | requirement:create | ${filename} | created\n`;
  fs.ensureFileSync(logPath);
  fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });

  // Step 7 — Git commit if enabled
  const config = loadConfig(cwd);
  gitAddAndCommit(cwd, `feat(requirement): add ${name}`, config);

  // Step 8 — Final output
  logSuccess(`Requirement '${name}' created at .r2pde-ai/requirements/${filename}`);
}
