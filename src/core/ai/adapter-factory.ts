import { IAiAdapter } from './ai-adapter.js';
import { MockAdapter } from './mock-adapter.js';
import { ApiAdapter } from './api-adapter.js';
import { PdeConfig } from '../config.js';

export function createAiAdapter(config: PdeConfig): IAiAdapter {
  const { apiUrl, apiKey } = config.ai;
  if (apiUrl && apiUrl.trim() !== '' && apiKey && apiKey.trim() !== '') {
    return new ApiAdapter({ apiUrl, apiKey, model: config.ai.model });
  }
  return new MockAdapter();
}
