import { Module } from '@nestjs/common';
import { ReviewerService } from './reviewer.service';
import { OllamaService } from './ollama.service';
import { GithubModule } from '../github/github.module';
import { SlackModule } from '../slack/slack.module';

@Module({
  imports: [GithubModule, SlackModule],
  providers: [ReviewerService, OllamaService],
  exports: [ReviewerService],
})
export class ReviewerModule {}