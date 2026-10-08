import Groq from 'groq-sdk';
import { env } from '../../config/env';
import { AiProvider, AiProviderError } from './aiProvider';

const MODEL = 'openai/gpt-oss-20b';
const MAX_TOKENS = 1024;

export class GroqProvider implements AiProvider {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  async complete(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
      });

            const text = response.choices[0]?.message?.content;
      if (!text) {
        console.error('[groq debug] finish_reason:', response.choices[0]?.finish_reason);
        console.error('[groq debug] full message object:', JSON.stringify(response.choices[0]?.message, null, 2));
        throw new AiProviderError('Groq returned an empty response');
      }
      return text;
    } catch (err: any) {
      throw new AiProviderError(err.message ?? 'Groq request failed');
    }
  }
}