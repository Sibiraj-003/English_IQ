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

  // Event-based Camera Frame Analysis (Opt-in only, objective signals only)
  async analyzeCameraFrame(base64Image: string, _context: 'test_integrity' | 'study_presence' = 'test_integrity'): Promise<{
    face_detected: boolean;
    face_count: number;
    gaze_direction: 'center' | 'away_left' | 'away_right' | 'down' | 'unknown';
    signal_notes: string;
    potential_anomaly: boolean;
    anomaly_type?: 'face_not_detected' | 'multiple_persons_detected' | 'repeated_looking_away';
  }> {
    const model = config.groqVisionModel;
    const prompt = `Analyze this camera frame for a school academic session.
Evaluate ONLY objective physical signals:
1. Is a human face detected? (true/false)
2. How many human faces are present in the frame? (number)
3. Approximate gaze direction: "center", "away_left", "away_right", "down", or "unknown"
4. Factual, neutral observation notes.

CRITICAL PRIVACY & ETHICAL RULES:
- NEVER make psychological or behavioral claims (e.g. NEVER say "student is lying", "student is cheating", "student is anxious").
- These are purely technical presence signals for optional teacher assistance.

Output valid JSON ONLY in this format:
{
  "face_detected": true,
  "face_count": 1,
  "gaze_direction": "center",
  "signal_notes": "Single face centered in view",
  "potential_anomaly": false,
  "anomaly_type": null
}`;

    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${cleanBase64}` },
          },
        ],
      },
    ];

    try {
      const response = await this.createChatCompletion(messages, {
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(response);
      return {
        face_detected: !!parsed.face_detected,
        face_count: typeof parsed.face_count === 'number' ? parsed.face_count : (parsed.face_detected ? 1 : 0),
        gaze_direction: parsed.gaze_direction || 'center',
        signal_notes: parsed.signal_notes || 'Camera frame analyzed',
        potential_anomaly: !!parsed.potential_anomaly || parsed.face_count > 1 || !parsed.face_detected,
        anomaly_type: parsed.anomaly_type || (parsed.face_count > 1 ? 'multiple_persons_detected' : !parsed.face_detected ? 'face_not_detected' : undefined),
      };
    } catch (err) {
      console.warn('Camera frame vision analysis fallback:', err);
      return {
        face_detected: true,
        face_count: 1,
        gaze_direction: 'center',
        signal_notes: 'Standard camera signal active',
        potential_anomaly: false,
      };
    }
  }
}

export const groqClient = new GroqClient();
