import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { McpModule } from './mcp/mcp.module';
import { GithubModule } from './github/github.module';
import { SlackModule } from './slack/slack.module';
import { ReviewerModule } from './reviewer/reviewer.module';
import { WebhookModule } from './webhook/webhook.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    McpModule,
    GithubModule,
    SlackModule,
    ReviewerModule,
    WebhookModule,
    HealthModule,
  ],
})
export class AppModule {}