import Groq from 'groq-sdk';
import { ZodSchema } from 'zod';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
] as const;

type Model = (typeof MODELS)[number];

interface CacheEntry {
  response: string;
  timestamp: number;
}

interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  cache?: boolean;
  maxRetries?: number;
}

interface GenerateStructuredOptions<T> extends GenerateOptions {
  schema: object;
  zodSchema?: ZodSchema<T>;
}

export interface LLMMetrics {
  inputTokens: number;
  outputTokens: number;
  calls: number;
  estimatedCost: number;
}

export class AgentLLMClient {
  private client: Groq;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private currentModelIndex = 0;

  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private callCount = 0;
  // Groq pricing (approximate)
  private static COST_PER_1K_INPUT = 0.00005;
  private static COST_PER_1K_OUTPUT = 0.0001;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    this.client = new Groq({ apiKey });
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private trackUsage(input: string, output: string): void {
    const inputTokens = this.estimateTokens(input);
    const outputTokens = this.estimateTokens(output);
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.callCount++;
  }

  getMetrics(): LLMMetrics {
    const inputCost = (this.totalInputTokens / 1000) * AgentLLMClient.COST_PER_1K_INPUT;
    const outputCost = (this.totalOutputTokens / 1000) * AgentLLMClient.COST_PER_1K_OUTPUT;
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      calls: this.callCount,
      estimatedCost: inputCost + outputCost,
    };
  }

  clearMetrics(): void {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.callCount = 0;
  }

  private getCacheKey(prompt: string, systemPrompt?: string): string {
    return `${systemPrompt || ''}::${prompt}`;
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private setCache(key: string, response: string): void {
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  private normalizeStringValues(obj: unknown): unknown {
    if (typeof obj === 'string') return obj.toLowerCase().trim();
    if (Array.isArray(obj)) return obj.map(item => this.normalizeStringValues(item));
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.normalizeStringValues(value);
      }
      return result;
    }
    return obj;
  }

  private extractJSON(response: string): unknown {
    let cleaned = response.trim();

    const jsonBlockMatch = cleaned.match(/^```(?:json)?\s*\n([\s\S]*)\n```\s*$/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1].trim();
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      // fall through
    }

    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    const candidate = objectMatch?.[0] || arrayMatch?.[0];

    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch {
        // fall through
      }
    }

    throw new Error('No valid JSON found in response');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCurrentModel(): Model {
    return MODELS[this.currentModelIndex];
  }

  private switchToNextModel(): boolean {
    if (this.currentModelIndex < MODELS.length - 1) {
      this.currentModelIndex++;
      return true;
    }
    return false;
  }

  async generate(options: GenerateOptions): Promise<string> {
    const { prompt, systemPrompt, cache = true, maxRetries = 3 } = options;

    // Reset to primary model for each new call so one agent's fallback
    // doesn't permanently degrade all subsequent agents
    this.currentModelIndex = 0;

    // Check cache
    if (cache) {
      const cacheKey = this.getCacheKey(prompt, systemPrompt);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.client.chat.completions.create({
          model: this.getCurrentModel(),
          messages,
          temperature: 0.7,
          max_tokens: 8192,
        });

        const text = response.choices[0]?.message?.content || '';

        this.trackUsage(prompt + (systemPrompt || ''), text);

        // Cache successful response
        if (cache) {
          const cacheKey = this.getCacheKey(prompt, systemPrompt);
          this.setCache(cacheKey, text);
        }

        return text;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorObj = error as { status?: number; message?: string };

        if (errorObj?.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);

          if (attempt >= 1) {
            this.switchToNextModel();
          }
          continue;
        }

        if (errorObj?.status === 404 || errorObj?.message?.includes('not found')) {
          if (this.switchToNextModel()) {
            continue;
          }
        }

        if (this.switchToNextModel()) {
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
    const { prompt, systemPrompt, schema, zodSchema, cache = true, maxRetries = 3 } = options;

    const structuredPrompt = `${prompt}

Respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

Return ONLY the JSON, no markdown or explanation.`;

    this.currentModelIndex = 0;

    for (let structuredAttempt = 0; structuredAttempt < 2; structuredAttempt++) {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: structuredPrompt });

      let response: string;
      try {
        const result = await this.client.chat.completions.create({
          model: this.getCurrentModel(),
          messages,
          temperature: 0.5,
          max_tokens: 16384,
          response_format: { type: 'json_object' },
        });
        response = result.choices[0]?.message?.content || '';
        this.trackUsage(structuredPrompt + (systemPrompt || ''), response);
      } catch {
        response = await this.generate({ prompt: structuredPrompt, systemPrompt, cache, maxRetries });
      }

      try {
        const parsed = this.extractJSON(response);

        if (zodSchema) {
          const validated = zodSchema.safeParse(parsed);
          if (validated.success) return validated.data;

          const normalized = this.normalizeStringValues(parsed);
          const retryValidated = zodSchema.safeParse(normalized);
          if (retryValidated.success) return retryValidated.data;

          if (structuredAttempt === 0) continue;
          throw new Error(`LLM response failed schema validation: ${validated.error.message}`);
        }

        return parsed as T;
      } catch (e) {
        if (structuredAttempt === 0 && !(e instanceof Error && e.message.includes('schema validation'))) {
          continue;
        }
        if (e instanceof Error && e.message.includes('schema validation')) throw e;
        throw new Error(`Invalid JSON response from LLM: ${response.slice(0, 200)}...`);
      }
    }

    throw new Error('Structured generation failed after retries');
  }

  async generateStream(options: GenerateOptions & {
    onChunk: (text: string) => void;
  }): Promise<string> {
    const { prompt, systemPrompt, onChunk } = options;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model: this.getCurrentModel(),
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      stream: true,
    });

    let fullText = '';

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      fullText += text;
      onChunk(text);
    }

    return fullText;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let clientInstance: AgentLLMClient | null = null;

export function getAgentLLMClient(): AgentLLMClient {
  if (!clientInstance) {
    clientInstance = new AgentLLMClient();
  }
  return clientInstance;
}
