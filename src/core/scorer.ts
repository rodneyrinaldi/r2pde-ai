import fs from 'fs-extra';
import path from 'path';
import { loadConfig } from './config.js';
import { getPaths } from './paths.js';

export interface ScoreWarning {
  file: string;
  issue: string;
  severity: 'error' | 'warning';
}

export interface ScoreResult {
  total: number;
  passed: number;
  failed: number;
  warnings: ScoreWarning[];
  percentage: number;
  level: 'green' | 'yellow' | 'red';
}

function isKebabCase(filename: string): boolean {
  return /^[a-z0-9\-]+\.md$/.test(filename);
}

function parseMetadata(content: string): Record<string, string> | null {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('---', 3);
  if (end === -1) return null;
  const meta = content.slice(3, end).trim();
  const lines = meta.split(/\r?\n/);
  const obj: Record<string, string> = {};
  for (const line of lines) {
    const [k, ...rest] = line.split(':');
    if (k && rest.length) obj[k.trim()] = rest.join(':').trim();
  }
  return obj;
}

export function scoreProject(projectRoot: string, fromPath?: string): ScoreResult {
  const pdePaths = getPaths(projectRoot);
  const paths = {
    manifests: pdePaths.manifests,
    contracts: pdePaths.contracts,
    requirements: pdePaths.requirements,
  };
  const folders = ['manifests', 'contracts', 'requirements'];
  const foldersToProcess = fromPath && folders.includes(fromPath)
    ? [fromPath]
    : folders;

  let total = 0, passed = 0, failed = 0;
  const warnings: ScoreWarning[] = [];
  const found: Record<string, boolean> = { manifests: false, contracts: false, requirements: false };

  for (const folder of folders) {
    const dir = paths[folder as keyof typeof paths];
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
      if (files.length > 0) found[folder] = true;
    }
  }

  for (const folder of foldersToProcess) {
    const dir = paths[folder as keyof typeof paths];
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      // Always use POSIX-style for warnings
      const relativePath = `${folder}/${file}`.replace(/\\/g, '/');

      ++total;
      if (content.trim().startsWith('---')) {
        ++passed;
      } else {
        ++failed;
        warnings.push({ file: relativePath, issue: 'Missing metadata header', severity: 'warning' });
      }

      const meta = parseMetadata(content);
      const endOfMeta = content.indexOf('---', 3);
      
      ++total;
      if (meta && meta.name) {
        ++passed;
      } else {
        ++failed;
        warnings.push({ file: relativePath, issue: 'Missing name field in metadata', severity: 'warning' });
      }
      
      ++total;
      if (meta && meta.description) {
        ++passed;
      } else {
        ++failed;
        warnings.push({ file: relativePath, issue: 'Missing description field', severity: 'warning' });
      }
      
      ++total;
      if (endOfMeta !== -1 && content.slice(endOfMeta + 3).trim().length > 0) {
        ++passed;
      } else {
        ++failed;
        warnings.push({ file: relativePath, issue: 'File has no content beyond metadata', severity: 'warning' });
      }
      
      ++total;
      if (isKebabCase(file)) {
        ++passed;
      } else {
        ++failed;
        warnings.push({ file: relativePath, issue: 'Filename is not kebab-case', severity: 'warning' });
      }
    }
  }

  if (!fromPath) {
    ++total;
    if (found.manifests) {
      ++passed;
    } else {
      ++failed;
      warnings.push({ file: 'manifests/', issue: 'No manifests defined', severity: 'error' });
    }
    ++total;
    if (found.contracts) {
      ++passed;
    } else {
      ++failed;
      warnings.push({ file: 'contracts/', issue: 'No contracts defined', severity: 'error' });
    }
    ++total;
    if (found.requirements) {
      ++passed;
    } else {
      ++failed;
      warnings.push({ file: 'requirements/', issue: 'No requirements defined', severity: 'error' });
    }
  }

  const percentage = total > 0 ? Math.round((passed / total) * 1000) / 10 : 100;
  const issuePercentage = total > 0 ? (failed / total) * 100 : 0;
  const config = loadConfig(projectRoot);
  
  let level: 'green' | 'yellow' | 'red' = 'red';
  if (issuePercentage <= config.score.green.max) level = 'green';
  else if (issuePercentage <= config.score.yellow.max) level = 'yellow';
  
  return { total, passed, failed, warnings, percentage, level };
}
