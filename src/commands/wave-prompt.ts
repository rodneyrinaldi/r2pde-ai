import { Command } from 'commander';
import { getPaths } from '../core/paths.js';
import { logError, logWarn, logInfo, logSuccess } from '../core/logger.js';
import { scoreProject } from '../core/scorer.js';
import { select, confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { createAiAdapter } from '../core/ai/adapter-factory.js';

function logScore(level: 'green' | 'yellow' | 'red', msg: string) {
  let emoji = '🟢';
  if (level === 'yellow') emoji = '🟡';
  if (level === 'red') emoji = '🔴';
  logInfo(`${emoji} ${msg}`);
}

export const wavePromptCommand = new Command('wave:prompt')
  .description('Generate consolidated prompt for current wave')
  .action(async () => {
    const cwd = process.cwd();
    const paths = getPaths(cwd);
    if (!fs.existsSync(paths.root)) {
      logError('r2pde-ai not initialized. Run r2pde-ai init first.');
      return;
    }
    // Step 2 — Score check
    const score = scoreProject(cwd);
    if (score.level === 'red') {
      logScore('red', 'Score is RED. Generating prompt with critical issues may produce poor results.');
      logInfo('Prompt generation with RED score may produce poor results.');
      const doContinue = await confirm({ message: 'Score is RED. Generating prompt with critical issues may produce poor results. Continue?', default: false });
      if (!doContinue) {
        logInfo('Operation cancelled.');
        return;
      }
    } else if (score.level === 'yellow') {
      logScore('yellow', 'Score is YELLOW. Proceeding with warnings.');
      logWarn('Proceeding with warnings.');
    } else {
      logScore('green', 'Score is healthy.');
    }
    // Step 3 — Ask wave
    logInfo('The implementation wave to generate a prompt for. Each wave covers a specific layer of the project.');
    const wave = await select({
      message: 'Select a wave:',
      choices: [
        { name: 'Framework', value: 'framework' },
        { name: 'Architecture', value: 'architecture' },
        { name: 'Core (errors, logs, security)', value: 'core' },
        { name: 'Authentication', value: 'authentication' },
        { name: 'Users', value: 'users' },
        { name: 'UI/UX', value: 'ui-ux' },
        { name: 'Tests', value: 'tests' },
        { name: 'Documentation', value: 'documentation' }
      ]
    });
    // Step 4 — Load artifacts
    function readOrPlaceholder(file: string) {
      return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '[No artifacts defined]';
    }
    function readAllOrPlaceholder(dir: string) {
      if (!fs.existsSync(dir)) return '[No artifacts defined]';
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
      if (files.length === 0) return '[No artifacts defined]';
      return files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n---\n');
    }
    const indexContent = readOrPlaceholder(path.join(paths.root, 'pde.index.md'));
    const manifestosContent = readAllOrPlaceholder(paths.manifestos);
    const contractsContent = readAllOrPlaceholder(paths.contracts);
    const requirementsContent = readAllOrPlaceholder(paths.requirements);
    // Step 5 — Generate prompt
    const now = new Date();
    const tsFmt = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const filename = `${wave}-${tsFmt}.md`;
    const prompt = `# r2pde-ai — Wave Prompt: ${wave}\nGenerated: ${now.toISOString()}\nScore: ${score.level === 'green' ? '🟢' : score.level === 'yellow' ? '🟡' : '🔴'} ${score.percentage}%\n\n---\n\n## Project Context\n${indexContent}\n\n---\n\n## Manifestos\n${manifestosContent}\n\n---\n\n## Contracts\n${contractsContent}\n\n---\n\n## Requirements\n${requirementsContent}\n\n---\n\n## Wave Objective\nYou are an AI coding assistant working on the ${wave} wave of this project.\nYour task is to implement everything required for this wave following ALL manifestos, contracts, and requirements defined above.\nDo not deviate from the defined architecture, naming conventions, or code patterns.\nGenerate production-ready TypeScript code only.\nAsk no questions — implement based on the context provided.\n\n## Wave: ${wave}\nImplement the ${wave} layer of the project as defined by the artifacts above.\nFollow all contracts strictly. Apply all manifesto principles. Satisfy all requirements.\n`;

    // Step 5.1 — AI Adapter
    const configPath = path.join(paths.root, 'pde.config.json');
    const config = fs.existsSync(configPath) ? fs.readJsonSync(configPath) : {};
    const adapter = createAiAdapter(config);

    if (adapter.isReal()) {
      logInfo('AI API configured — sending prompt to AI...');
    } else {
      logInfo('No AI API configured — running in offline mode.');
    }

    const ora = (await import('ora')).default;
    const spinner = ora('Generating response...').start();

    let outputPrompt: string;
    let isApi = adapter.isReal();
    try {
      if (isApi) {
        const metaInstruction = `You are an expert software architect and prompt engineer.\nYour task is to analyze the project context below and generate an optimized, precise prompt for GitHub Copilot.\nThe prompt you generate will be pasted directly into GitHub Copilot to implement the \"${wave}\" wave of this project.\nMake the prompt:\n- Specific and unambiguous\n- Aligned with the defined architecture, patterns, and conventions\n- Structured so Copilot understands exactly what to implement and how\n- Include all relevant constraints from manifestos and contracts\n- Reference acceptance criteria from requirements\nDo not generate code yourself. Generate only the optimized Copilot prompt.\n\n## Project Context\n${prompt}\n\nNow generate the optimized GitHub Copilot prompt for the \"${wave}\" wave:`;
        outputPrompt = await adapter.generate(metaInstruction);
      } else {
        outputPrompt = await adapter.generate(prompt);
      }
      spinner.succeed('Response received.');
    } catch (err) {
      spinner.fail('AI API call failed.');
      logError(err instanceof Error ? err.message : 'Unknown error');
      logInfo('Falling back to offline mode — saving prompt for copy/paste.');
      outputPrompt = prompt;
      isApi = false;
    }

    // Step 6 — Save outputPrompt
    const promptsDir = path.join(paths.root, 'prompts');
    fs.ensureDirSync(promptsDir);
    const filePath = path.join(promptsDir, filename);
    fs.writeFileSync(filePath, outputPrompt, { encoding: 'utf8' });
    // Step 7 — Log entry
    const logPath = path.join(paths.logs, 'pde.log.md');
    const logLine = `- ${now.toISOString()} | wave:prompt | ${wave} | ${filename} | generated\n`;
    fs.ensureFileSync(logPath);
    fs.appendFileSync(logPath, logLine, { encoding: 'utf8' });
    // Step 8 — Output
    if (isApi) {
      logSuccess(`Optimized prompt generated by AI and saved to .r2pde-ai/prompts/${filename}`);
      logInfo('This prompt was optimized by AI. Copy and paste it into GitHub Copilot.');
    } else {
      logSuccess(`Prompt generated: .r2pde-ai/prompts/${filename}`);
      logInfo('Copy the content of this file and paste it into GitHub Copilot.');
    }
  });
