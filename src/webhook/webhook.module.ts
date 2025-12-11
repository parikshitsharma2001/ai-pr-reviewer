import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ReviewerModule } from '../reviewer/reviewer.module';

@Module({
  imports: [ReviewerModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}