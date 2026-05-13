import { IAiAdapter } from './ai-adapter.js';

export interface AiConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export class ApiAdapter implements IAiAdapter {
  constructor(private config: AiConfig) {}

  isReal(): boolean {
    return true;
  }

  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.apiUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-20250514',
        max_tokens: 8096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} — ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    return data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }
}
