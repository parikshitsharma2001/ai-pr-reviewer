import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from '../reviewer/ollama.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly ollamaService: OllamaService,
  ) { }

  @Get()
  async check() {
    const ollamaHealthy = await this.ollamaService.checkHealth();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
      services: {
        ollama: ollamaHealthy ? 'healthy' : 'unhealthy',
        github: this.configService.get('GITHUB_TOKEN') ? 'configured' : 'not configured',
        slack: this.configService.get('SLACK_BOT_TOKEN') ? 'configured' : 'not configured',
      },
    };
  }

  @Get('ollama')
  async checkOllama() {
    const healthy = await this.ollamaService.checkHealth();
    return {
      service: 'ollama',
      status: healthy ? 'healthy' : 'unhealthy',
      baseUrl: this.configService.get('OLLAMA_BASE_URL'),
      model: this.configService.get('OLLAMA_MODEL'),
    };
  }

  @Get('sampleAPI')
  async testAPI() {
    const ollamaHealthy = await this.ollamaService.checkHealth();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
      services: {
        ollama: ollamaHealthy ? 'healthy' : 'unhealthy',
        github: this.configService.get('GITHUB_TOKEN') ? 'configured' : 'not configured',
        slack: this.configService.get('SLACK_BOT_TOKEN') ? 'configured' : 'not configured',
      },
    };
  }

}