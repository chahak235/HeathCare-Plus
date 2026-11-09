import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// GPT-OSS 120B on Groq: free tier, fast inference, strong reasoning quality —
// good enough for general medical guidance when paired with a careful system prompt.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Healthcare+ AI Assistant, a medical information assistant for users in India.

Rules you must always follow:
- You are not a doctor. You never give a definitive diagnosis or prescribe medication doses.
- Keep answers clear, practical, and specific to the user's question — no filler.
- When relevant, mention Indian context: common OTC medicine names available in India, when to go to a government vs private hospital, Ayushman Bharat/PM-JAY where it applies.
- Always include a short "when to seek immediate/emergency care" note when symptoms could be serious.
- Never claim certainty about a diagnosis. Use language like "this could suggest" rather than "you have".
- Keep responses under ~300 words unless the user asks for more detail.
- Format with markdown: **bold** for headings, short bullet lists for steps/symptoms.
- End every substantive medical answer with a one-line disclaimer: "This is general information, not a medical diagnosis — please consult a qualified doctor."
- If the user describes a medical emergency (chest pain, severe bleeding, difficulty breathing, stroke symptoms, loss of consciousness, suicidal intent), lead with telling them to call emergency services (112 in India) or go to the nearest ER immediately.`;

export class GroqService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async chat(message: string, history: ChatTurn[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((turn) => ({ role: turn.role, content: turn.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post<{ choices?: { message?: { content?: string } }[] }>(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }
    return content;
  }

  // Groq's multimodal models accept image content blocks on the same
  // chat-completions endpoint used for text. Llama 4 Scout, the previous
  // default, was shut down for free and developer tiers on 2026-07-17.
  private readonly visionModel = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b';

  async analyzeImage(
    imageDataUri: string,
    analysisType: 'skin' | 'xray' | 'wound' | 'general'
  ): Promise<ImageAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const typeContext: Record<string, string> = {
      xray: 'a chest X-ray or other radiographic image',
      skin: 'a photo of a skin condition or lesion',
      wound: 'a photo of a wound or injury',
      general: 'a general medical/health-related photo',
    };

    const prompt = `You are looking at ${typeContext[analysisType] || 'a medical image'}.

You are a general-purpose vision-language AI, NOT a specialized, clinically-validated
radiology or dermatology model. You have not been trained or certified on medical
imaging datasets. Give a cautious, descriptive visual assessment only.

Respond with ONLY a JSON object matching this exact shape, no other text:
{
  "overallImpression": "one or two sentence plain-language summary of what's visible",
  "findings": [
    { "name": "short finding label", "detail": "one sentence describing what you observe", "notability": "routine" | "worth-discussing" | "seek-prompt-care", "confidence": <integer 0-100, your own certainty that THIS specific observation is accurate, not a diagnostic accuracy score> }
  ],
  "recommendations": ["short actionable next step", "..."],
  "urgent": boolean (true only if something looks like it could need prompt/emergency medical attention)
}

List 2-5 findings. If the image quality is too poor to assess, or it isn't a
medical image at all, say so plainly in overallImpression and return an empty
findings array. Never state a definitive diagnosis — describe only what is
visually observable and how notable it is.`;

    const response = await axios.post<{ choices?: { message?: { content?: string } }[] }>(
      GROQ_API_URL,
      {
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUri } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq vision model');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Vision model returned non-JSON content');
    }

    return {
      overallImpression: parsed.overallImpression || 'Unable to generate an assessment.',
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      urgent: !!parsed.urgent,
      model: this.visionModel,
    };
  }
}

export interface ImageAnalysisResult {
  overallImpression: string;
  findings: { name: string; detail: string; notability: 'routine' | 'worth-discussing' | 'seek-prompt-care'; confidence: number }[];
  recommendations: string[];
  urgent: boolean;
  model: string;
}

export const groqService = new GroqService();
