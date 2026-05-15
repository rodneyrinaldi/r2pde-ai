// Arquivo movido para execução manual de testes de scaffold.
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SCAFFOLD_DIR = path.resolve('scaffold_done');
const GUIDE_PATH = path.resolve('scaffold-guide.yaml');

describe('scaffold-create CLI', () => {
  afterEach(() => {
    // Limpa a pasta scaffold_done após cada teste
    if (fs.existsSync(SCAFFOLD_DIR)) {
      fs.rmSync(SCAFFOLD_DIR, { recursive: true, force: true });
    }
  });

  it('deve criar a pasta scaffold_done ao rodar o comando', () => {
    execSync(`node ./dist/src/cli.js scaffold-create --guide ${GUIDE_PATH}`, { stdio: 'inherit' });
    expect(fs.existsSync(SCAFFOLD_DIR)).toBe(true);
  });
});
