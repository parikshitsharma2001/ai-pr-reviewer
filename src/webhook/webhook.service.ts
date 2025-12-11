import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReviewerService } from '../reviewer/reviewer.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly reviewerService: ReviewerService,
  ) {
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET') || '';
  }

  async handlePullRequestEvent(payload: any): Promise<void> {
    const action = payload.action;
    const prNumber = payload.pull_request?.number;

    this.logger.log(`Pull request event: ${action} for PR #${prNumber}`);

    // Trigger review on PR opened or synchronized (new commits pushed)
    if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
      this.logger.log(`Triggering review for PR #${prNumber}`);
      
      // Run review asynchronously
      this.triggerReview(prNumber).catch((error) => {
        this.logger.error(`Review failed for PR #${prNumber}: ${error.message}`);
      });
    }
  }

  async triggerReview(prNumber: number): Promise<void> {
    try {
      await this.reviewerService.reviewPullRequest(prNumber);
    } catch (error) {
      this.logger.error(`Failed to complete review for PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  async verifySignature(payload: any, signature: string): Promise<boolean> {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature verification');
      return true;
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

    if (signature !== digest) {
      throw new Error('Invalid webhook signature');
    }

    return true;
  }
}