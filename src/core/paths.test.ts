import { describe, it, expect } from 'vitest';
import path from 'path';
import { getPaths } from './paths.js';

describe('getPaths', () => {
  const projectRoot = path.resolve('/tmp/r2pde-ai-test');
  const paths = getPaths(projectRoot);

  it('returns object with all required keys', () => {
    expect(paths).toHaveProperty('root');
    expect(paths).toHaveProperty('config');
    expect(paths).toHaveProperty('index');
    expect(paths).toHaveProperty('guide');
    expect(paths).toHaveProperty('logs');
    expect(paths).toHaveProperty('manifests');
    expect(paths).toHaveProperty('contracts');
    expect(paths).toHaveProperty('requirements');
    expect(paths).toHaveProperty('waves');
    expect(paths).toHaveProperty('prompts');
    expect(paths).toHaveProperty('templates');
  });

  it('all paths are absolute', () => {
    (Object.keys(paths) as Array<keyof typeof paths>).forEach((key) => {
      expect(path.isAbsolute(paths[key])).toBe(true);
    });
  });

  it('all paths contain the projectRoot', () => {
    (Object.keys(paths) as Array<keyof typeof paths>).forEach((key) => {
      expect(paths[key].includes(projectRoot)).toBe(true);
    });
  });
});
