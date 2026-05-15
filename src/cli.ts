// ...existing code...
// ...existing code...
import { scaffoldCreateCommand } from './commands/scaffold-create.js';

import { resetCommand } from './commands/reset.js';
import { logsCommand } from './commands/logs.js';
import { requirementCreateCommand } from './commands/requirement-create.js';
import { requirementDeleteCommand } from './commands/requirement-delete.js';
import { scoreCommand } from './commands/score.js';
import { scoreConfigCommand } from './commands/score-config.js';

import { wavePromptCommand } from './commands/wave-prompt.js';
import { configSetCommand } from './commands/config-set.js';
import { configLangCommand } from './commands/config-lang.js';

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { doctorCommand } from './commands/doctor.js';

import { manifestCreateCommand } from './commands/manifest-create.js';
import { manifestDeleteCommand } from './commands/manifest-delete.js';
import { contractCreateCommand } from './commands/contract-create.js';
import { contractDeleteCommand } from './commands/contract-delete.js';

const program = new Command();
program.addHelpText('after', 'Examples:\n  $ r2pde-ai init\n  $ r2pde-ai doctor\n  $ r2pde-ai manifest:create\n  $ r2pde-ai contract:create\n  $ r2pde-ai requirement:create\n  $ r2pde-ai score\n  $ r2pde-ai score --from contracts\n  $ r2pde-ai wave:prompt\n  $ r2pde-ai config:set git.autoCommit true\n  $ r2pde-ai config:lang\n  $ r2pde-ai logs\n  $ r2pde-ai logs --clear\n  $ r2pde-ai reset\n\nDocumentation:\n  After init, read .r2pde-ai/GUIDE.md for full artifact reference.\n  Always paste .r2pde-ai/pde.index.md into your AI copilot before any prompt.');

program.addCommand(scaffoldCreateCommand);
program.addCommand(resetCommand);
program.addCommand(logsCommand);


program
  .command('requirement:create')
  .description('Create a new requirement')
  .option('--name <name>', 'Requirement name')
  .option('--type <type>', 'Requirement type (functional, non-functional, business-rule)')
  .option('--priority <priority>', 'Priority (high, medium, low)')
  .option('--description <description>', 'Requirement description')
  .option('--changeType <changeType>', 'Change type (feat, fix, improve)')
  .option('--acceptance <acceptance>', 'Acceptance criteria (semicolon or comma separated)')
  .option('--force', 'Overwrite requirement if it already exists')
  .action((opts) => {
    if (opts.name) process.argv.push('--name', opts.name);
    if (opts.type) process.argv.push('--type', opts.type);
    if (opts.priority) process.argv.push('--priority', opts.priority);
    if (opts.description) process.argv.push('--description', opts.description);
    if (opts.changeType) process.argv.push('--changeType', opts.changeType);
    if (opts.acceptance) process.argv.push('--acceptance', opts.acceptance);
    if (opts.force) process.argv.push('--force');
    void requirementCreateCommand();
  });

program
  .command('requirement:delete')
  .description('Delete an existing requirement')
  .action(() => {
    void requirementDeleteCommand();
  });


program
  .command('contract:create')
  .description('Create a new contract')
  .option('--name <name>', 'Contract name')
  .option('--type <type>', 'Contract type (architecture, tdd, ddd, security, permissions, routing, tests, commits, other)')
  .option('--enforcement <enforcement>', 'Enforcement level (mandatory, recommended)')
  .option('--description <description>', 'Contract description')
  .option('--changeType <changeType>', 'Change type (feat, fix, improve)')
  .option('--force', 'Overwrite contract if it already exists')
  .action((opts) => {
    if (opts.name) process.argv.push('--name', opts.name);
    if (opts.type) process.argv.push('--type', opts.type);
    if (opts.enforcement) process.argv.push('--enforcement', opts.enforcement);
    if (opts.description) process.argv.push('--description', opts.description);
    if (opts.changeType) process.argv.push('--changeType', opts.changeType);
    if (opts.force) process.argv.push('--force');
    void contractCreateCommand();
  });

program
  .command('contract:delete')
  .description('Delete an existing contract')
  .action(() => {
    void contractDeleteCommand();
  });

program
  .command('manifest:create')
  .description('Create a new manifest')
  .option('--name <name>', 'Manifest name')
  .option('--scope <scope>', 'Manifest scope (ui, ux, code-philosophy, development-culture, other)')
  .option('--description <description>', 'Manifest description')
  .option('--type <type>', 'Change type (feat, fix, improve)')
  .option('--force', 'Overwrite manifest if it already exists')
  .action((opts) => {
    process.argv.push('--name', opts.name || '');
    process.argv.push('--scope', opts.scope || '');
    process.argv.push('--description', opts.description || '');
    process.argv.push('--type', opts.type || '');
    if (opts.force) process.argv.push('--force');
    void manifestCreateCommand();
  });

program
  .command('manifest:delete')
  .description('Delete an existing manifest')
  .action(() => {
    void manifestDeleteCommand();
  });

program.addCommand(scoreCommand);
program.addCommand(scoreConfigCommand);
program.addCommand(wavePromptCommand);
program.addCommand(configSetCommand);
program.addCommand(configLangCommand);

program
  .name('r2pde-ai')
  .description('Pilot Driven Engineering A CLI framework that bridges the gap between architectural intent and AI-generated code.')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize r2pde-ai in the current project')
  .action(() => {
    void initCommand();
  });


program
  .command('doctor')
  .description('Check the health of the r2pde-ai environment')
  .action(() => {
    void doctorCommand();
  });

program.parse();
