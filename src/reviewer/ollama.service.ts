import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly client: AxiosInstance;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.model = this.configService.get<string>('OLLAMA_MODEL') || 'llama2';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 120000, // 2 minutes for LLM generation
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Ollama service initialized with model: ${this.model}`);
  }

  async generate(prompt: string, options?: any): Promise<string> {
    try {
      this.logger.log('Generating response from Ollama...');

      const request: OllamaGenerateRequest = {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          ...options,
        },
      };

      const response = await this.client.post<OllamaGenerateResponse>(
        '/api/generate',
        request,
      );

      this.logger.log('Successfully received response from Ollama');
      return response.data.response;
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`);
      throw error;
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      this.logger.log('Sending chat request to Ollama...');

      const response = await this.client.post('/api/chat', {
        model: this.model,
        messages,
        stream: false,
      });

      this.logger.log('Successfully received chat response from Ollama');
      return response.data.message.content;
    } catch (error) {
      this.logger.error(`Failed to chat with Ollama: ${error.message}`);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get('/api/tags');
      return true;
    } catch (error) {
      this.logger.error(`Ollama health check failed: ${error.message}`);
      return false;
    }
  }
}