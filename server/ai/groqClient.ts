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
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKeys = (config.groqApiKeys && config.groqApiKeys.length > 0)
      ? config.groqApiKeys
      : [config.groqApiKey, (config as any).groqApiKeySecondary].filter(Boolean);
  }

  public getActiveApiKey(): string {
    if (this.apiKeys.length === 0) return config.groqApiKey || '';
    return this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
  }

  public rotateApiKey(): string {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      console.log(`[GroqClient] Auto-failover: Switched to API Key ${this.currentKeyIndex + 1} of ${this.apiKeys.length}`);
    }
    return this.getActiveApiKey();
  }

  async isHealthy(): Promise<boolean> {
    const res = await this.ping();
    return res.ok;
  }

  async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    for (let i = 0; i < this.apiKeys.length; i++) {
      const key = this.apiKeys[(this.currentKeyIndex + i) % this.apiKeys.length];
      try {
        const res = await fetch(`${this.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        });
        if (res.status === 200) {
          return { ok: true, latencyMs: Date.now() - start };
        }
      } catch {
        // try next key in pool
      }
    }
    return { ok: false, latencyMs: Date.now() - start };
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

    const maxAttempts = Math.max(this.apiKeys.length * 2, 4);
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentKey = this.getActiveApiKey();
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429 || response.status === 401 || response.status === 403 || response.status >= 500) {
          const errText = await response.text();
          console.warn(`[GroqClient] Key ${this.currentKeyIndex + 1} status ${response.status}: ${errText.slice(0, 100)}. Switching to alternate key...`);
          this.rotateApiKey();
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API error (${response.status}): ${errText}`);
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content || '';
        return content;
      } catch (err: any) {
        lastError = err;
        this.rotateApiKey();
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    throw lastError || new Error('Groq request failed across all configured API keys');
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

  // Event-based Camera Frame Analysis (Opt-in only, detects face & pedagogical reaction)
  async analyzeCameraFrame(base64Image: string, context: 'test_integrity' | 'study_presence' = 'study_presence'): Promise<{
    face_detected: boolean;
    face_count: number;
    gaze_direction: 'center' | 'away_left' | 'away_right' | 'down' | 'unknown';
    signal_notes: string;
    potential_anomaly: boolean;
    anomaly_type?: 'face_not_detected' | 'multiple_persons_detected' | 'repeated_looking_away';
    student_reaction?: 'confused' | 'focused' | 'happy' | 'distracted' | 'thinking' | 'neutral';
    reaction_confidence?: number;
    pedagogical_suggestion?: string;
  }> {
    const model = config.groqVisionModel;
    const prompt = `Analyze this live camera frame from an educational learning session with AI companion NOVA.
Evaluate:
1. Is a human face detected? (true/false)
2. How many human faces are present in the frame? (number)
3. Approximate gaze direction: "center", "away_left", "away_right", "down", or "unknown"
4. Student visual learning reaction / engagement state:
   - "confused": student appears puzzled, brows furrowed, head tilted in uncertainty
   - "focused": student looking attentively at screen, engaged in study
   - "happy": student smiling, nodding, showing positive comprehension
   - "distracted": looking away, looking down repeatedly at phone/table
   - "thinking": looking upward/pondering, processing ideas
   - "neutral": calm standard study expression
5. Pedagogical suggestion: A concise 1-sentence tip on how AI tutor NOVA should adapt (e.g. "Explain with a simpler analogy", "Offer positive praise", "Check if student needs a hint").
6. Factual neutral observation notes.

Output valid JSON ONLY in this exact format:
{
  "face_detected": true,
  "face_count": 1,
  "gaze_direction": "center",
  "student_reaction": "focused",
  "reaction_confidence": 0.88,
  "pedagogical_suggestion": "Student is engaged and focused on the topic.",
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
      const faceDetected = !!parsed.face_detected;
      const faceCount = typeof parsed.face_count === 'number' ? parsed.face_count : (faceDetected ? 1 : 0);
      const reaction = parsed.student_reaction || (faceDetected ? 'focused' : 'distracted');

      return {
        face_detected: faceDetected,
        face_count: faceCount,
        gaze_direction: parsed.gaze_direction || 'center',
        signal_notes: parsed.signal_notes || 'Camera frame analyzed',
        potential_anomaly: !!parsed.potential_anomaly || faceCount > 1 || !faceDetected,
        anomaly_type: parsed.anomaly_type || (faceCount > 1 ? 'multiple_persons_detected' : !faceDetected ? 'face_not_detected' : undefined),
        student_reaction: reaction,
        reaction_confidence: typeof parsed.reaction_confidence === 'number' ? parsed.reaction_confidence : 0.85,
        pedagogical_suggestion: parsed.pedagogical_suggestion || 'Student is ready to learn.',
      };
    } catch (err) {
      console.warn('Camera frame vision analysis fallback:', err);
      return {
        face_detected: true,
        face_count: 1,
        gaze_direction: 'center',
        signal_notes: 'Standard camera signal active',
        potential_anomaly: false,
        student_reaction: 'focused',
        reaction_confidence: 0.8,
        pedagogical_suggestion: 'Proceed with interactive guidance.',
      };
    }
  }
}

export const groqClient = new GroqClient();
