import { describe, it, expect } from 'vitest';
import { createAiAdapter } from './adapter-factory.js';
import { DEFAULT_CONFIG } from '../config.js';
import { MockAdapter } from './mock-adapter.js';
import { ApiAdapter } from './api-adapter.js';

describe('createAiAdapter', () => {
  it('returns MockAdapter when no API config', () => {
    const adapter = createAiAdapter(DEFAULT_CONFIG);
    expect(adapter).toBeInstanceOf(MockAdapter);
    expect(adapter.isReal()).toBe(false);
  });

  it('returns ApiAdapter when apiUrl and apiKey are set', () => {
    const config = {
      ...DEFAULT_CONFIG,
      ai: { apiUrl: 'https://api.anthropic.com', apiKey: 'sk-test', model: 'claude-sonnet-4-20250514' },
    };
    const adapter = createAiAdapter(config);
    expect(adapter).toBeInstanceOf(ApiAdapter);
    expect(adapter.isReal()).toBe(true);
  });

  it('MockAdapter.generate returns string containing original prompt', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.generate('test prompt');
    expect(result).toContain('test prompt');
    expect(result).toContain('(Mock Mode)');
  });
});
