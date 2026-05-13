
// Removed legacy inquirer import
import { input, select, confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path, { dirname } from 'path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { getPaths } from '../core/paths.js';
import { loadConfig, saveConfig, PdeConfig, DEFAULT_CONFIG } from '../core/config.js';
import { logWarn, logInfo, logSuccess } from '../core/logger.js';
import { isGitRepo, gitAddAndCommit } from '../core/git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const paths = getPaths(cwd);

  // Step 1 — Validate environment FIRST
  const alreadyInitialized = fs.existsSync(paths.root);
  if (alreadyInitialized) {
    logWarn('r2pde-ai is already initialized in this project.');
    logInfo('Reinitialize will overwrite existing configuration.');
    const reinit = await confirm({
      message: 'r2pde-ai is already initialized. Reinitialize?',
      default: false
    });
    if (!reinit) {
      logInfo('Initialization cancelled.');
      return;
    }
  }

  if (!isGitRepo(cwd)) {
    logWarn('No git repository detected. It is strongly recommended to initialize git before proceeding.');
  }

  // Step 2 — Create folders AFTER validation
  fs.ensureDirSync(paths.root);
  fs.ensureDirSync(paths.templates);
  fs.ensureDirSync(paths.manifestos);
  fs.ensureDirSync(paths.contracts);
  fs.ensureDirSync(paths.requirements);
  fs.ensureDirSync(paths.waves);
  fs.ensureDirSync(paths.prompts);
  fs.ensureDirSync(paths.logs);

  // Step 3 — Interactive project setup
  const folderName = path.basename(cwd);
  logInfo('The name of your project. Used in generated files and git commits.');
  const projectName = await input({ message: 'Project name:', default: folderName });
  logInfo('The type of product you are building. Affects which contracts and waves are prioritized.');
  const projectType = await select({ message: 'Project type:', choices: [
    { name: 'Micro SaaS', value: 'micro-saas' },
    { name: 'Landing Page', value: 'landing-page' },
    { name: 'API', value: 'api' },
    { name: 'Dashboard', value: 'dashboard' },
    { name: 'E-commerce', value: 'e-commerce' },
    { name: 'Other', value: 'other' }
  ] });
  logInfo('The structural pattern of your codebase. Impacts folder structure and separation of concerns.');
  const architecture = await select({ message: 'Architecture:', choices: [
    { name: 'Monolith', value: 'monolith' },
    { name: 'Microservices', value: 'microservices' },
    { name: 'Monorepo', value: 'monorepo' },
    { name: 'Serverless', value: 'serverless' }
  ] });
  logInfo('The coding philosophy to follow. Guides naming, structure, and complexity decisions.');
  const codePattern = await select({ message: 'Code pattern:', choices: [
    { name: 'Clean Code', value: 'clean-code' },
    { name: 'DDD', value: 'ddd' },
    { name: 'SOLID', value: 'solid' },
    { name: 'Pragmatic', value: 'pragmatic' }
  ] });
  logInfo('The current stage of the project. MVP relaxes some contracts; production enforces all.');
  const maturity = await select({ message: 'Maturity:', choices: [
    { name: 'MVP', value: 'mvp' },
    { name: 'Production', value: 'production' }
  ] });
  logInfo('The primary protocol between services or client and server.');
  const communication = await select({ message: 'Communication:', choices: [
    { name: 'HTTP REST', value: 'http-rest' },
    { name: 'GraphQL', value: 'graphql' },
    { name: 'gRPC', value: 'grpc' },
    { name: 'WebSockets', value: 'websockets' },
    { name: 'Other', value: 'other' }
  ] });
  logInfo('The type of data storage your project will use.');
  const persistence = await select({ message: 'Persistence:', choices: [
    { name: 'SQL', value: 'sql' },
    { name: 'NoSQL', value: 'nosql' },
    { name: 'In-memory', value: 'in-memory' },
    { name: 'Other', value: 'other' }
  ] });
  logInfo('Whether the project requires user login and session management.');
  const hasAuth = await confirm({ message: 'Has authentication?', default: true });
  logInfo('Whether the project handles billing, subscriptions, or transactions.');
  const hasPayment = await confirm({ message: 'Has payment?', default: false });
  logInfo('Whether the project connects to third-party APIs or services.');
  const hasIntegrations = await confirm({ message: 'Has external integrations?', default: false });
  logInfo('Who will use this product. Affects UX contracts and compliance requirements.');
  const audience = await select({
    message: 'Target audience:',
    choices: [
      { name: 'B2B (Business to Business)', value: 'b2b' },
      { name: 'B2C (Business to Consumer)', value: 'b2c' },
      { name: 'Internal', value: 'internal' },
    ],
  });
  logInfo('The main technology stack. Used to generate stack-specific prompts for your AI copilot.');
  const stack = await input({
    message: 'Primary stack:',
    default: 'Node.js / TypeScript',
  });
  logInfo('The language used in CLI output messages.');
  const language = await select({ message: 'Language for messages:', choices: [
    { name: 'English', value: 'en' },
    { name: 'Português', value: 'pt' }
  ] });
  logInfo('The language used in generated markdown artifact files.');
  const artifactsLanguage = await select({ message: 'Language for artifacts:', choices: [
    { name: 'English', value: 'en' },
    { name: 'Português', value: 'pt' }
  ] });

  // Compose config object from prompt results
  const config: PdeConfig = {
    ...DEFAULT_CONFIG,
    version: '0.1.0',
    language,
    artifactsLanguage,
    git: { ...DEFAULT_CONFIG.git },
    score: { ...DEFAULT_CONFIG.score },
    ai: { ...DEFAULT_CONFIG.ai },
    project: {
      type: projectType,
      architecture,
      maturity,
      hasAuth,
      hasPayment,
      hasIntegrations,
      audience,
      stack,
    },
  };

  // Step 4 — Save config file
  saveConfig(cwd, config);

  // Step 5 — Generate pde.index.md
  const indexContent = `# PDE Index — ${projectName}

> Always paste this file into your AI copilot before any prompt.

## Project Profile
- **Type**: ${projectType}
- **Architecture**: ${architecture}
- **Code Pattern**: ${codePattern}
- **Maturity**: ${maturity}
- **Communication**: ${communication}
- **Persistence**: ${persistence}
- **Authentication**: ${hasAuth ? 'yes' : 'no'}
- **Payment**: ${hasPayment ? 'yes' : 'no'}
- **Integrations**: ${hasIntegrations ? 'yes' : 'no'}
- **Audience**: ${audience}
- **Stack**: ${stack}

## Artifact Map
- Manifestos: .r2pde-ai/manifestos/
- Contracts: .r2pde-ai/contracts/
- Requirements: .r2pde-ai/requirements/
- Waves: .r2pde-ai/waves/
- Prompts: .r2pde-ai/prompts/
- Logs: .r2pde-ai/logs/

## Framework Version
- r2pde-ai: 0.1.0
`;
  fs.writeFileSync(paths.index, indexContent, { encoding: 'utf8' });

  // Step 6 — Copy templates
  const templateFiles = [
    { src: path.resolve(__dirname, '../templates/manifesto.template.md'), dest: path.resolve(paths.templates, 'manifesto.template.md') },
    { src: path.resolve(__dirname, '../templates/contract.template.md'), dest: path.resolve(paths.templates, 'contract.template.md') },
    { src: path.resolve(__dirname, '../templates/requirement.template.md'), dest: path.resolve(paths.templates, 'requirement.template.md') },
  ];
  const runtimeTemplateDir = path.resolve(__dirname, '../templates');
  for (const { dest } of templateFiles) {
    const src = path.resolve(runtimeTemplateDir, path.basename(dest));
    fs.copyFileSync(src, dest);
  }

  // Step 7 — Generate GUIDE.md
  const guideContent = `# r2pde-ai GUIDE\n\n## What is a Manifesto?\nA Manifesto defines guiding principles for your project. Create one when you want to establish a core value or philosophy.\n\n**Structure:**\n- Purpose\n- Principles\n- Scope\n- Exceptions\n\n## What is a Contract?\nA Contract enforces rules or agreements in your project. Create one to formalize expectations.\n\n**Structure:**\n- Purpose\n- Rules\n- Violations\n- Exceptions\n\n## What is a Requirement?\nA Requirement describes a functional, non-functional, or business rule. Create one for every need or constraint.\n\n**Structure:**\n- Type\n- Description\n- Acceptance Criteria\n- Dependencies\n- Notes\n\n## What are Waves?\nWaves are iterative cycles of delivery. Each wave advances the project with new artifacts.\n\n**How to advance:**\n- Complete all requirements and contracts for the current wave.\n- Review quality score.\n- Start the next wave.\n\n## What is the Quality Score?\nThe Quality Score measures project health:\n- 🟢 Green: 0-30\n- 🟡 Yellow: 31-70\n- 🔴 Red: 71-100\n\n## How to use pde.index.md\nPaste .r2pde-ai/pde.index.md into your AI copilot before any prompt to provide full project context.\n\n## Prompt Generation (wave:prompt)\n\n- **Offline mode:** Generates a structured prompt for copy/paste into GitHub Copilot.\n- **API mode:** Generates an AI-optimized prompt for copy/paste into GitHub Copilot.\n- **Copilot always generates the code** — the AI API only improves the prompt quality.\n\n## CLI Commands Reference\n- init: Initialize r2pde-ai in the current project\n- doctor: Diagnose project health\n`;
  fs.writeFileSync(paths.guide, guideContent, { encoding: 'utf8' });

  // Step 8 — Git commit if enabled
  gitAddAndCommit(cwd, 'init: project initialized', config);

  // Step 9 — Final output
  logSuccess('r2pde-ai initialized successfully.');
  logInfo('Start by reading .r2pde-ai/GUIDE.md');
  logInfo('Then paste .r2pde-ai/pde.index.md into your AI copilot before any prompt.');
}
