import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from './config.js';

const tempDir = path.join(os.tmpdir(), 'r2pde-ai-test-config');
const configDir = path.join(tempDir, '.r2pde-ai');
const configPath = path.join(configDir, 'pde.config.json');

afterEach(() => {
  fs.removeSync(tempDir);
});

describe('config', () => {
  it('loadConfig returns DEFAULT_CONFIG when file does not exist', () => {
    fs.removeSync(tempDir);
    const config = loadConfig(tempDir);
    expect(config).toMatchObject(DEFAULT_CONFIG);
  });

  it('loadConfig merges file content with defaults', () => {
    fs.ensureDirSync(configDir);
    fs.writeJsonSync(configPath, { language: 'pt', project: { type: 'api' } });
    const config = loadConfig(tempDir);
    expect(config.language).toBe('pt');
    expect(config.project.type).toBe('api');
    expect(config.git).toMatchObject(DEFAULT_CONFIG.git);
    expect(config.score).toMatchObject(DEFAULT_CONFIG.score);
    expect(config.ai).toMatchObject(DEFAULT_CONFIG.ai);
  });

  it('saveConfig writes valid JSON with correct fields', () => {
    fs.ensureDirSync(configDir);
    saveConfig(tempDir, { ...DEFAULT_CONFIG, language: 'pt' });
    const file = fs.readJsonSync(configPath);
    expect(file.language).toBe('pt');
    expect(file).toHaveProperty('project');
  });

  it('DEFAULT_CONFIG has all required fields with correct types', () => {
    expect(DEFAULT_CONFIG).toHaveProperty('language');
    expect(DEFAULT_CONFIG).toHaveProperty('artifactsLanguage');
    expect(DEFAULT_CONFIG).toHaveProperty('project');
    expect(typeof DEFAULT_CONFIG.language).toBe('string');
    expect(typeof DEFAULT_CONFIG.project).toBe('object');
  });
});
