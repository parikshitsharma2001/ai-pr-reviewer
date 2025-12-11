import { Controller, Post, Body, Headers, Logger, HttpCode } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('github')
  @HttpCode(200)
  async handleGithubWebhook(
    @Body() payload: any,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    this.logger.log(`Received GitHub webhook event: ${event}`);

    try {
      // Verify webhook signature (optional but recommended)
      // await this.webhookService.verifySignature(payload, signature);

      // Handle pull request events
      if (event === 'pull_request') {
        await this.webhookService.handlePullRequestEvent(payload);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Failed to handle webhook: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @Post('manual-review')
  @HttpCode(200)
  async triggerManualReview(@Body() body: { prNumber: number }) {
    this.logger.log(`Manual review triggered for PR #${body.prNumber}`);

    try {
      await this.webhookService.triggerReview(body.prNumber);
      return { status: 'success', message: `Review started for PR #${body.prNumber}` };
    } catch (error) {
      this.logger.error(`Failed to trigger review: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
}