import { Command } from 'commander';
import { loadConfig, saveConfig } from '../core/config.js';
import { logSuccess, logWarn } from '../core/logger.js';

function setByDot(obj: any, path: string, value: unknown): boolean {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; ++i) {
    if (!(keys[i] in cur)) return false;
    cur = cur[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (!(last in cur)) return false;
  cur[last] = value;
  return true;
}

export const configSetCommand = new Command('config:set')
  .description('Set a configuration value')
  .argument('<key>', 'Config key (dot notation)')
  .argument('<value>', 'Value to set')
  .action((key, value) => {
    const cwd = process.cwd();
    const config = loadConfig(cwd);
    let v: unknown = value;
    if (value === 'true') v = true;
    else if (value === 'false') v = false;
    else if (!isNaN(Number(value))) v = Number(value);
    const ok = setByDot(config, key, v);
    if (!ok) {
      logWarn(`Key does not exist in config: ${key}`);
    }
    saveConfig(cwd, config);
    logSuccess(`Config updated: ${key} = ${v}`);
  });
