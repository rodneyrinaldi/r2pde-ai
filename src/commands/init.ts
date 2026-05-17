
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

  // Step 1 � Validate environment FIRST
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

  // Step 2 � Create folders AFTER validation
  fs.ensureDirSync(paths.root);
  fs.ensureDirSync(paths.templates);
  fs.ensureDirSync(paths.manifests);
  fs.ensureDirSync(paths.contracts);
  fs.ensureDirSync(paths.requirements);
  fs.ensureDirSync(paths.waves);
  fs.ensureDirSync(paths.prompts);
  fs.ensureDirSync(paths.logs);

  // Step 3 � Interactive project setup
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
    { name: 'Portugu�s', value: 'pt' }
  ] });
  logInfo('The language used in generated markdown artifact files.');
  const artifactsLanguage = await select({ message: 'Language for artifacts:', choices: [
    { name: 'English', value: 'en' },
    { name: 'Portugu�s', value: 'pt' }
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

  // Step 4 � Save config file
  saveConfig(cwd, config);

  // Step 5 � Generate pde.index.md
  const indexContent = `# PDE Index � ${projectName}

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
- manifests: .r2pde-ai/manifests/
- Contracts: .r2pde-ai/contracts/
- Requirements: .r2pde-ai/requirements/
- Waves: .r2pde-ai/waves/
- Prompts: .r2pde-ai/prompts/
- Logs: .r2pde-ai/logs/

## Framework Version
- r2pde-ai: 0.1.0
`;
  fs.writeFileSync(paths.index, indexContent, { encoding: 'utf8' });


  // Step 6 – Copy templates and scaffold.yaml to project root
  const templateFiles = [
    { src: path.resolve(__dirname, '../../templates/manifest.template.md'), dest: path.resolve(paths.templates, 'manifest.template.md') },
    { src: path.resolve(__dirname, '../../templates/contract.template.md'), dest: path.resolve(paths.templates, 'contract.template.md') },
    { src: path.resolve(__dirname, '../../templates/requirement.template.md'), dest: path.resolve(paths.templates, 'requirement.template.md') },
  ];
  for (const { src, dest } of templateFiles) {
    fs.copyFileSync(src, dest);
  }

  // Copy scaffold.yaml from dist/templates (if built) or templates (dev) to project root
  let scaffoldSrc = path.resolve(__dirname, '../../dist/templates/scaffold.yaml');
  if (!fs.existsSync(scaffoldSrc)) {
    scaffoldSrc = path.resolve(__dirname, '../../templates/scaffold.yaml');
  }
  const scaffoldDest = path.resolve(cwd, 'scaffold.yaml');
  if (!fs.existsSync(scaffoldDest)) {
    fs.copyFileSync(scaffoldSrc, scaffoldDest);
    logInfo('Arquivo scaffold.yaml copiado para a raiz do projeto. Edite conforme necessário para usar o scaffold-create.');
  } else {
    logWarn('Arquivo scaffold.yaml já existe na raiz do projeto. Não sobrescrito.');
  }


    const guideContent = [
      '# r2pde-ai GUIDE',
      '',
      '## What is a manifest?',
      'A manifest defines guiding principles for your project. Create one when you want to establish a core value or philosophy.',
      '',
      '**Structure:**',
      '- Purpose',
      '- Principles',
      '- Scope',
      '- Exceptions',
      '- changeType (feat, fix, improve)',
      '',
      '## What is a Contract?',
      'A Contract enforces rules or agreements in your project. Create one to formalize expectations.',
      '',
      '**Structure:**',
      '- Purpose',
      '- Rules',
      '- Violations',
      '- Exceptions',
      '- changeType (feat, fix, improve)',
      '',
      '## What is a Requirement?',
      'A Requirement describes a functional, non-functional, or business rule. Create one for every need or constraint.',
      '',
      '**Structure:**',
      '- Type',
      '- Description',
      '- Acceptance Criteria',
      '- Dependencies',
      '- Notes',
      '- changeType (feat, fix, improve)',
      '',
      '## About changeType',
      'Every artifact now includes a changeType field in its frontmatter.',
      '- feat: New feature, principle, rule, or requirement.',
      '- fix: Correction of an error, bug, or adjustment.',
      '- improve: Enhancement or refinement of an existing artifact.',
      '',
      '**Example frontmatter:**',
      '---',
      'name: User Authentication',
      'scope: security',
      'description: Enforces secure authentication for all users',
      'changeType: feat',
      'createdAt: 2026-05-15T12:00:00.000Z',
      '---',
      '',
      '## What are Waves?',
      'Waves are iterative cycles of delivery. Each wave advances the project with new artifacts.',
      '',
      '**How to advance:**',
      '- Complete all requirements and contracts for the current wave.',
      '- Review quality score.',
      '- Start the next wave.',
      '',
      '## What is the Quality Score?',
      'The Quality Score measures project health:',
      '- 🟢 Green: 0-30',
      '- 🟡 Yellow: 31-70',
      '- 🔴 Red: 71-100',
      '',
      '## How to use pde.index.md',
      'Paste .r2pde-ai/pde.index.md into your AI copilot before any prompt to provide full project context.',
      '',
      '## Prompt Generation (wave:prompt)',
      '',
      '- **Offline mode:** Generates a structured prompt for copy/paste into GitHub Copilot.',
      '- **API mode:** Generates an AI-optimized prompt for copy/paste into GitHub Copilot.',
      '- **Copilot always generates the code** — the AI API only improves the prompt quality.',
      '',
      '## CLI Commands Reference',
      '- init: Initialize r2pde-ai in the current project',
      '- doctor: Diagnose project health',
    ].join('\n');
    fs.writeFileSync(paths.guide, guideContent, { encoding: "utf8" });

  // Step 8 � Git commit if enabled
  gitAddAndCommit(cwd, 'init: project initialized', config);

  // Step 9 � Final output
  logSuccess('r2pde-ai initialized successfully.');
  logInfo('Start by reading .r2pde-ai/GUIDE.md');
  logInfo('Then paste .r2pde-ai/pde.index.md into your AI copilot before any prompt.');
}


