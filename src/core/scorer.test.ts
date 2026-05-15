import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { scoreProject } from './scorer.js';
import { getPaths } from './paths.js';
import { DEFAULT_CONFIG } from './config.js';

const tempDir = path.join(os.tmpdir(), 'r2pde-ai-test-scorer');
afterEach(() => {
  if (fs.existsSync(tempDir)) {
    fs.removeSync(tempDir);
  }
});

describe('scoreProject', () => {
  it('Empty project returns 3 errors (no manifests, contracts, requirements)', () => {
    fs.ensureDirSync(tempDir);
    const result = scoreProject(tempDir);
    expect(result.failed).toBeGreaterThanOrEqual(3);
    const issues = result.warnings.map(w => w.issue);
    expect(issues).toContain('No manifests defined');
    expect(issues).toContain('No contracts defined');
    expect(issues).toContain('No requirements defined');
  });

  it('File with metadata header passes that check', () => {
    const paths = getPaths(tempDir);
    fs.ensureDirSync(paths.manifests);
    fs.writeFileSync(path.join(paths.manifests, 'test-file.md'), '---\nname: Test\ndescription: desc\n---\nContent');
    const result = scoreProject(tempDir);
    const fileWarnings = result.warnings.filter(w => w.file.replace(/\\/g, '/').includes('test-file.md'));
    expect(fileWarnings.some(w => w.issue === 'Missing metadata header')).toBe(false);
  });

  it('File without metadata header generates warning', () => {
    const paths = getPaths(tempDir);
    fs.ensureDirSync(paths.manifests);
    fs.writeFileSync(path.join(paths.manifests, 'test-file.md'), 'No header');
    const result = scoreProject(tempDir);
    const fileWarnings = result.warnings.filter(w => w.file.replace(/\\/g, '/').includes('test-file.md'));
    expect(fileWarnings.some(w => w.issue === 'Missing metadata header')).toBe(true);
  });

  it('issuePercentage 0% -> green level', () => {
    const paths = getPaths(tempDir);
    fs.ensureDirSync(paths.manifests);
    fs.writeFileSync(path.join(paths.manifests, 'm-file.md'), '---\nname: M\ndescription: d\n---\ncontent');
    fs.ensureDirSync(paths.contracts);
    fs.writeFileSync(path.join(paths.contracts, 'c-file.md'), '---\nname: C\ndescription: d\n---\ncontent');
    fs.ensureDirSync(paths.requirements);
    fs.writeFileSync(path.join(paths.requirements, 'r-file.md'), '---\nname: R\ndescription: d\n---\ncontent');
    
    fs.ensureDirSync(path.join(tempDir, '.r2pde-ai'));
    fs.writeJsonSync(path.join(tempDir, '.r2pde-ai', 'pde.config.json'), {
      ...DEFAULT_CONFIG,
      score: { green: { max: 30 }, yellow: { max: 70 }, red: { max: 100 } },
    });
    
    const result = scoreProject(tempDir);
    expect(result.level).toBe('green');
  });

  it('issuePercentage 50% -> yellow level', () => {
    const paths = getPaths(tempDir);
    // 1 valid file
    fs.ensureDirSync(paths.manifests);
    fs.writeFileSync(path.join(paths.manifests, 'm-file.md'), '---\nname: M\ndescription: d\n---\ncontent');
    // Missing contracts and requirements (2 failures)
    // 5 checks per file. 1 file = 5 checks. All pass.
    // 3 folder checks. 1 passes, 2 fail.
    // Total checks: 5 + 3 = 8.
    // Passed: 5 + 1 = 6. Failed: 2.
    // Percentage: 2/8 = 25%.
    
    fs.ensureDirSync(path.join(tempDir, '.r2pde-ai'));
    fs.writeJsonSync(path.join(tempDir, '.r2pde-ai', 'pde.config.json'), {
      ...DEFAULT_CONFIG,
      score: { green: { max: 10 }, yellow: { max: 50 }, red: { max: 100 } },
    });
    
    const result = scoreProject(tempDir);
    // 25% failure is between 10% and 50%
    expect(result.level).toBe('yellow');
  });

  it('issuePercentage 100% -> red level', () => {
    fs.ensureDirSync(tempDir);
    fs.ensureDirSync(path.join(tempDir, '.r2pde-ai'));
    fs.writeJsonSync(path.join(tempDir, '.r2pde-ai', 'pde.config.json'), {
      ...DEFAULT_CONFIG,
      score: { green: { max: 10 }, yellow: { max: 20 }, red: { max: 100 } },
    });
    const result = scoreProject(tempDir);
    expect(result.level).toBe('red');
  });

  it('fromPath filters correctly (contracts -> skips manifests)', () => {
    const paths = getPaths(tempDir);
    fs.ensureDirSync(paths.contracts);
    fs.writeFileSync(path.join(paths.contracts, 'c1-file.md'), '---\nname: C1\ndescription: d\n---\ncontent');
    const result = scoreProject(tempDir, 'contracts');
    expect(result.warnings.some(w => w.file.replace(/\\/g, '/').includes('manifests'))).toBe(false);
  });
});
