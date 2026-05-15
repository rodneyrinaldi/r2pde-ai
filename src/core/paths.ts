import path from 'path';

export function getPaths(projectRoot: string) {
  const resolve = (...segments: string[]) => path.resolve(projectRoot, ...segments);
  return {
    root: resolve('.r2pde-ai'),
    config: resolve('.r2pde-ai', 'pde.config.json'),
    index: resolve('.r2pde-ai', 'pde.index.md'),
    guide: resolve('.r2pde-ai', 'GUIDE.md'),
    templates: resolve('.r2pde-ai', 'templates'),
    manifests: resolve('.r2pde-ai', 'manifests'),
    contracts: resolve('.r2pde-ai', 'contracts'),
    requirements: resolve('.r2pde-ai', 'requirements'),
    waves: resolve('.r2pde-ai', 'waves'),
    prompts: resolve('.r2pde-ai', 'prompts'),
    logs: resolve('.r2pde-ai', 'logs'),
  };
}
