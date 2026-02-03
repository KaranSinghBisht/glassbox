import { GoogleGenAI } from '@google/genai';

const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
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
}

export class AgentLLMClient {
  private client: GoogleGenAI;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private currentModelIndex = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.client = new GoogleGenAI({ apiKey });
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
      console.log(`Switching to model: ${this.getCurrentModel()}`);
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
        
        // Cache successful response
        if (cache) {
          const cacheKey = this.getCacheKey(prompt, systemPrompt);
          this.setCache(cacheKey, text);
        }
        
        return text;
      } catch (error: any) {
        lastError = error;
        
        // Rate limit - try exponential backoff
        if (error?.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${delay}ms before retry...`);
          await this.sleep(delay);
          
          // After backoff, try switching models
          if (attempt >= 1) {
            this.switchToNextModel();
          }
          continue;
        }
        
        // Other errors - try switching models
        if (this.switchToNextModel()) {
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
    const { prompt, systemPrompt, schema, cache = true, maxRetries = 3 } = options;
    
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

    // Parse JSON response
    try {
      // Clean up response (remove markdown code blocks if present)
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
      
      return JSON.parse(cleaned.trim()) as T;
    } catch (e) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('Invalid JSON response from LLM');
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
