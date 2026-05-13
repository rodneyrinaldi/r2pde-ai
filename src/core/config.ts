import fs from 'fs-extra';
import path from 'path';

export interface PdeConfig {
  version: string;
  language: string;
  artifactsLanguage: string;
  git: {
    autoCommit: boolean;
    commitMessagePrefix: string;
  };
  score: {
    green: { max: number };
    yellow: { max: number };
    red: { max: number };
  };
  ai: {
    apiUrl: string;
    apiKey: string;
    model: string;
  };
  project: {
    type: string;
    architecture: string;
    maturity: string;
    hasAuth: boolean;
    hasPayment: boolean;
    hasIntegrations: boolean;
    audience: string;
    stack: string;
  };
}

export const DEFAULT_CONFIG: PdeConfig = {
  version: '0.1.0',
  language: 'en',
  artifactsLanguage: 'en',
  git: {
    autoCommit: false,
    commitMessagePrefix: 'pde:',
  },
  score: {
    green: { max: 30 },
    yellow: { max: 70 },
    red: { max: 100 },
  },
  ai: {
    apiUrl: '',
    apiKey: '',
    model: '',
  },
  project: {
    type: '',
    architecture: '',
    maturity: '',
    hasAuth: false,
    hasPayment: false,
    hasIntegrations: false,
    audience: '',
    stack: '',
  },
};

export function loadConfig(projectRoot: string): PdeConfig {
  const configPath = path.resolve(projectRoot, '.r2pde-ai', 'pde.config.json');
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }
  try {
    const fileConfig = fs.readJsonSync(configPath);
    return {
      ...DEFAULT_CONFIG,
      ...fileConfig,
      git: { ...DEFAULT_CONFIG.git, ...fileConfig.git },
      score: {
        green: { ...DEFAULT_CONFIG.score.green, ...(fileConfig.score?.green || {}) },
        yellow: { ...DEFAULT_CONFIG.score.yellow, ...(fileConfig.score?.yellow || {}) },
        red: { ...DEFAULT_CONFIG.score.red, ...(fileConfig.score?.red || {}) },
      },
      ai: { ...DEFAULT_CONFIG.ai, ...fileConfig.ai },
      project: { ...DEFAULT_CONFIG.project, ...fileConfig.project },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(projectRoot: string, config: PdeConfig): void {
  const dir = path.resolve(projectRoot, '.r2pde-ai');
  const configPath = path.resolve(dir, 'pde.config.json');
  fs.ensureDirSync(dir);
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}
