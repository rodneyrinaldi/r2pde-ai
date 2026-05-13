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

import { manifestoCreateCommand } from './commands/manifesto-create.js';
import { manifestoDeleteCommand } from './commands/manifesto-delete.js';
import { contractCreateCommand } from './commands/contract-create.js';
import { contractDeleteCommand } from './commands/contract-delete.js';

const program = new Command();
program.addHelpText('after', `
Examples:
  $ r2pde-ai init
  $ r2pde-ai doctor
  $ r2pde-ai manifesto:create
  $ r2pde-ai contract:create
  $ r2pde-ai requirement:create
  $ r2pde-ai score
  $ r2pde-ai score --from contracts
  $ r2pde-ai wave:prompt
  $ r2pde-ai config:set git.autoCommit true
  $ r2pde-ai config:lang
  $ r2pde-ai logs
  $ r2pde-ai logs --clear
  $ r2pde-ai reset

Documentation:
  After init, read .r2pde-ai/GUIDE.md for full artifact reference.
  Always paste .r2pde-ai/pde.index.md into your AI copilot before any prompt.
`);

program.addCommand(resetCommand);
program.addCommand(logsCommand);
program
  .command('requirement:create')
  .description('Create a new requirement')
  .action(() => {
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
  .action(() => {
    void contractCreateCommand();
  });

program
  .command('contract:delete')
  .description('Delete an existing contract')
  .action(() => {
    void contractDeleteCommand();
  });
program
  .command('manifesto:create')
  .description('Create a new manifesto')
  .action(() => {
    void manifestoCreateCommand();
  });

program
  .command('manifesto:delete')
  .description('Delete an existing manifesto')
  .action(() => {
    void manifestoDeleteCommand();
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
