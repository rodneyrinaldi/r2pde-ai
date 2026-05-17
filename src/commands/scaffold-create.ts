
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { spawnSync } from 'child_process';
import { Command } from 'commander';
import { logWarn, logError, logSuccess } from '../core/logger.js';

/**
 * Executa um comando CLI simulando respostas interativas, se necessário.
 */
function runCliCommand(cmd: string, answers?: string[], cwd?: string) {
  const [command, ...args] = cmd.split(' ');
  let proc;
  if (answers && answers.length) {
    proc = spawnSync(command, args, {
      input: answers.join('\n') + '\n',
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd,
      shell: process.platform === 'win32',
    });
  } else {
    proc = spawnSync(command, args, {
      stdio: 'inherit',
      cwd,
      shell: process.platform === 'win32',
    });
  }
  if (proc.status !== 0) {
    logError(`Erro ao executar: ${cmd}`);
    throw new Error(`Erro ao executar: ${cmd}`);
  }
}

async function scaffoldCreateHandler(opts: { guide: string }) {
  let guidePath = path.resolve(opts.guide);
  if (!fs.existsSync(guidePath)) {
    // fallback: procurar em dist/scaffold-guide.yaml (próximo ao binário)
    let cliDir = path.dirname(new URL(import.meta.url).pathname);
    if (process.platform === 'win32' && cliDir.startsWith('/')) {
      cliDir = cliDir.slice(1);
    }
    let fallbackPath = path.resolve(cliDir, '../scaffold-guide.yaml');
    if (!fs.existsSync(fallbackPath)) {
      // fallback: procurar na raiz do pacote instalado
      try {
        fallbackPath = require.resolve('r2pde-ai/scaffold-guide.yaml');
      } catch (e) {
        fallbackPath = '';
      }
    }
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      guidePath = fallbackPath;
    } else {
      logError(`Arquivo YAML não encontrado: ${guidePath}`);
      process.exit(1);
    }
  }
  const doc = yaml.load(fs.readFileSync(guidePath, 'utf8')) as any;
  let cwd = process.cwd();
  if (doc.project?.root) {
    const absRoot = path.resolve(doc.project.root);
    if (!fs.existsSync(absRoot)) fs.mkdirSync(absRoot, { recursive: true });
    cwd = absRoot;
  }
  let hasCriticalError = false;
  for (const step of doc.project.steps) {
    try {
      switch (step.type) {
        case 'mkdir': {
          const dir = path.isAbsolute(step.path) ? step.path : path.join(cwd, step.path);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          break;
        }
        case 'git-init':
          runCliCommand('git init', undefined, cwd);
          break;
        case 'cli':
          runCliCommand(step.command, step.answers, cwd);
          break;
        case 'file': {
          const filePath = path.isAbsolute(step.path) ? step.path : path.join(cwd, step.path);
          fs.writeFileSync(filePath, step.content || '', 'utf8');
          break;
        }
        default:
          logWarn(`Tipo de etapa desconhecido: ${step.type}`);
      }
    } catch (err) {
      logError(`Erro ao executar etapa: ${JSON.stringify(step)}\n${err}`);
      hasCriticalError = true;
    }
  }
  if (doc.project.files) {
    for (const file of doc.project.files) {
      const filePath = path.isAbsolute(file) ? file : path.join(cwd, file);
      if (!fs.existsSync(filePath)) {
        logWarn(`Arquivo esperado não encontrado: ${filePath}`);
      }
    }
  }
  // Copiar a pasta dist do projeto original para o scaffold gerado
  try {
    const sourceDist = path.resolve(__dirname, '../../dist');
    const targetDist = path.join(cwd, 'dist');
    if (fs.existsSync(sourceDist)) {
      copyFolderRecursiveSync(sourceDist, targetDist);
      logSuccess('Pasta dist copiada para o scaffold gerado.');
    } else {
      logWarn('Pasta dist não encontrada para copiar.');
    }
  } catch (err) {
    logError('Erro ao copiar pasta dist: ' + err);
  }

  if (!hasCriticalError) {
    logSuccess('Scaffold concluído com sucesso!');
  } else {
    logError('Scaffold finalizado com erros críticos. Revise as mensagens acima.');
  }
}

// Função utilitária para cópia recursiva de pastas
function copyFolderRecursiveSync(source: string, target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    for (const file of files) {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    }
  }
}

export const scaffoldCreateCommand = new Command('scaffold-create')
  .description('Gera um projeto de exemplo a partir de um arquivo de guia YAML. Se --guide não for informado, será usado ./scaffold.yaml da raiz do projeto.')
  .option('--guide <yaml>', 'Caminho para o arquivo de guia YAML (opcional, padrão: ./scaffold.yaml na raiz do projeto)')
  .action((opts) => {
    const cwd = process.cwd();
    let guidePath = opts.guide ? path.resolve(opts.guide) : path.resolve(cwd, 'scaffold.yaml');
    // Se não existir scaffold.yaml na raiz, copiar do template
    if (!fs.existsSync(guidePath)) {
      // Tenta copiar de dist/templates primeiro, depois de templates
      let templatePath = path.resolve(__dirname, '../../dist/templates/scaffold.yaml');
      if (!fs.existsSync(templatePath)) {
        templatePath = path.resolve(__dirname, '../../templates/scaffold.yaml');
      }
      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, guidePath);
        logSuccess('Arquivo scaffold.yaml copiado para a raiz do projeto.');
      } else {
        console.error('Arquivo scaffold.yaml não encontrado nem na raiz nem nos templates do pacote.');
        process.exit(1);
      }
    }
    scaffoldCreateHandler({ guide: guidePath }).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  });
