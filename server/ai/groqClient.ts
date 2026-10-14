import { config } from '../config/index.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export class GroqClient {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = config.groqApiKey;
  }

  async isHealthy(): Promise<boolean> {
    const res = await this.ping();
    return res.ok;
  }

  async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return { ok: res.status === 200, latencyMs: Date.now() - start };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: GroqCompletionOptions = {}
  ): Promise<string> {
    const model = options.model || config.groqTextModel;
    const body: Record<string, any> = {
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2048,
    };

    if (options.response_format) {
      body.response_format = options.response_format;
    }

    let retries = 2;
    while (retries >= 0) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API error (${response.status}): ${errText}`);
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content || '';
        return content;
      } catch (err: any) {
        if (retries === 0) {
          throw err;
        }
        retries--;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error('Groq request failed after retries');
  }

  // Vision / OCR extraction
  async extractTextFromImage(base64Image: string, prompt?: string): Promise<string> {
    const model = config.groqVisionModel;
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || 'Extract all visible text from this school textbook page accurately. Preserve headings, paragraphs, exercise questions, vocabulary words, and page numbers. Format as clean text.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }
    ];

    return this.createChatCompletion(messages, { model, temperature: 0.1 });
  }
}

export const groqClient = new GroqClient();
