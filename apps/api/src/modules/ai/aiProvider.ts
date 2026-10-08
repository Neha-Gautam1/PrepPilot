export interface AiProvider {
  complete(prompt: string): Promise<string>;
}

export class AiProviderError extends Error {}