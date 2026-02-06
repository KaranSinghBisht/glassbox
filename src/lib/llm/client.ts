import { GoogleGenAI } from '@google/genai';
import { ZodSchema } from 'zod';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash-lite',
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
  private client: GoogleGenAI;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private currentModelIndex = 0;
  
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private callCount = 0;
  private static COST_PER_1K_INPUT = 0.00015;
  private static COST_PER_1K_OUTPUT = 0.0006;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.client = new GoogleGenAI({ apiKey });
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
        const response = await this.client.models.generateContent({
          model: this.getCurrentModel(),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: systemPrompt ? {
            systemInstruction: systemPrompt,
          } : undefined,
        });

        const text = response.text || '';
        
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

    const response = await this.generate({
      prompt: structuredPrompt,
      systemPrompt,
      cache,
      maxRetries,
    });

    try {
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      
      const parsed = JSON.parse(cleaned.trim());
      
      if (zodSchema) {
        const validated = zodSchema.safeParse(parsed);
        if (!validated.success) {
          throw new Error(`LLM response failed schema validation: ${validated.error.message}`);
        }
        return validated.data;
      }
      
      return parsed as T;
    } catch (e) {
      if (e instanceof Error && e.message.includes('schema validation')) {
        throw e;
      }
      throw new Error(`Invalid JSON response from LLM: ${response.slice(0, 200)}...`);
    }
  }

  async generateStream(options: GenerateOptions & {
    onChunk: (text: string) => void;
  }): Promise<string> {
    const { prompt, systemPrompt, onChunk } = options;
    
    const response = await this.client.models.generateContentStream({
      model: this.getCurrentModel(),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: systemPrompt ? {
        systemInstruction: systemPrompt,
      } : undefined,
    });

    let fullText = '';
    
    for await (const chunk of response) {
      const text = chunk.text || '';
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
