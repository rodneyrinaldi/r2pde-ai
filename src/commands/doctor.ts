import fs from 'fs-extra';
import path from 'path';
import { getPaths } from '../core/paths.js';
import { loadConfig } from '../core/config.js';
import { logSuccess, logWarn, logError, logInfo } from '../core/logger.js';
import { isGitRepo } from '../core/git.js';

export async function doctorCommand(): Promise<void> {
  const cwd = process.cwd();
  const paths = getPaths(cwd);
  let hasError = false;
  let hasWarn = false;

  // Check 1 — r2pde-ai initialized
  if (!fs.existsSync(paths.root)) {
    logError('r2pde-ai not initialized. Run r2pde-ai init first.');
    hasError = true;
    return printSummary(hasError, hasWarn);
  } else {
    logSuccess('r2pde-ai folder found');
  }

  // Check 2 — pde.config.json exists and is valid
  if (!fs.existsSync(paths.config)) {
    logError('pde.config.json not found. Run r2pde-ai init to generate.');
    hasError = true;
    return printSummary(hasError, hasWarn);
  } else {
    try {
      loadConfig(cwd);
      logSuccess('pde.config.json found and valid');
    } catch (e) {
      logError('pde.config.json is invalid JSON.');
      hasError = true;
      return printSummary(hasError, hasWarn);
    }
  }

  // Check 3 — pde.index.md exists
  if (fs.existsSync(paths.index)) {
    logSuccess('pde.index.md found');
  } else {
    logWarn('pde.index.md not found. Run r2pde-ai init to regenerate.');
    hasWarn = true;
  }

  // Check 4 — All required folders exist
  const requiredFolders = [
    paths.manifests,
    paths.contracts,
    paths.requirements,
    paths.waves,
    paths.prompts,
    paths.logs,
    paths.templates,
  ];
  let missingFolders: string[] = [];
  for (const folder of requiredFolders) {
    if (!fs.existsSync(folder)) {
      missingFolders.push(path.basename(folder));
      logWarn(`${path.basename(folder)} folder not found`);
      hasWarn = true;
    }
  }
  if (missingFolders.length === 0) {
    logSuccess('All required folders found');
  }

  // Check 5 — Templates present
  const templateFiles = [
    'manifest.template.md',
    'contract.template.md',
    'requirement.template.md',
  ];
  let missingTemplates: string[] = [];
  for (const file of templateFiles) {
    if (!fs.existsSync(path.join(paths.templates, file))) {
      missingTemplates.push(file);
      logWarn(`${file} not found in templates`);
      hasWarn = true;
    }
  }
  if (missingTemplates.length === 0) {
    logSuccess('All templates found');
  }

  // Check 6 — Git repository
  if (isGitRepo(cwd)) {
    logSuccess('Git repository detected');
  } else {
    logWarn('No git repository detected. Strongly recommended.');
    hasWarn = true;
  }

  // Check 7 — AI API configured
  const config = loadConfig(cwd);
  if (config.ai.apiUrl && config.ai.apiKey) {
    logSuccess('AI API configured — prompts will be optimized by AI before Copilot use.');
  } else {
    logInfo('AI API not configured — prompts will be generated in offline mode for manual copy/paste into Copilot.');
  }

  printSummary(hasError, hasWarn);
}

function printSummary(hasError: boolean, hasWarn: boolean) {
  if (hasError) {
    logError('Environment has critical issues. Fix before proceeding.');
  } else if (hasWarn) {
    logWarn('Environment has warnings. Review above.');
  } else {
    logSuccess('All checks passed. Environment is healthy.');
  }
}
