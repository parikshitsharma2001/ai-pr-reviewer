import { Injectable, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { SlackService } from '../slack/slack.service';
import { OllamaService } from './ollama.service';
import { PullRequestData, ReviewResult, ReviewFinding } from '../types/pr.types';
import { reviewPromptTemplate } from '../config/mcp.config';

@Injectable()
export class ReviewerService {
  private readonly logger = new Logger(ReviewerService.name);

  constructor(
    private readonly githubService: GithubService,
    private readonly slackService: SlackService,
    private readonly ollamaService: OllamaService,
  ) {}

  async reviewPullRequest(prNumber: number): Promise<void> {
    this.logger.log(`Starting review for PR #${prNumber}`);

    try {
      // Step 1: Fetch PR data from GitHub
      const prData = await this.githubService.getPullRequest(prNumber);
      const files = await this.githubService.getPullRequestFiles(prNumber);
      const diff = await this.githubService.getDiff(prNumber);

      this.logger.log(`Fetched PR #${prNumber}: ${prData.title}`);
      this.logger.log(`Files changed: ${files.length}`);

      // Step 2: Generate review using Ollama
      const review = await this.generateReview(prData, diff, files.length);

      // Step 3: Post review to GitHub
      await this.githubService.createReviewComment(prNumber, review.rawReview);

      // Step 4: Send notification to Slack
      await this.slackService.sendPRReview(prData, review);

      // Step 5: Add label based on assessment
      const label = this.getReviewLabel(review.assessment);
      await this.githubService.addLabel(prNumber, label);

      this.logger.log(`Successfully completed review for PR #${prNumber}`);
    } catch (error) {
      this.logger.error(`Failed to review PR #${prNumber}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateReview(
    prData: PullRequestData,
    diff: string,
    filesCount: number,
  ): Promise<ReviewResult> {
    // Prepare the prompt
    const prompt = reviewPromptTemplate
      .replace('{{title}}', prData.title)
      .replace('{{author}}', prData.author)
      .replace('{{branch}}', `${prData.branch} → ${prData.baseBranch}`)
      .replace('{{filesCount}}', filesCount.toString())
      .replace('{{diff}}', this.truncateDiff(diff));

    // Generate review using Ollama
    const rawReview = await this.ollamaService.generate(prompt, {
      temperature: 0.3, // Lower temperature for more consistent reviews
    });

    // Parse the review response
    const review = this.parseReviewResponse(rawReview);

    return review;
  }

  private parseReviewResponse(rawReview: string): ReviewResult {
    // Basic parsing logic - can be enhanced with more sophisticated parsing
    const summary = this.extractSection(rawReview, 'Summary') || rawReview.substring(0, 200);
    const findings = this.extractFindings(rawReview);
    const recommendations = this.extractRecommendations(rawReview);
    const assessment = this.determineAssessment(rawReview, findings);

    return {
      summary,
      findings,
      recommendations,
      assessment,
      rawReview,
    };
  }

  private extractSection(text: string, sectionName: string): string | null {
    const patterns = [
      new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i'),
      new RegExp(`##\\s*${sectionName}[:\\s]*\\s*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
      new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractFindings(text: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const keywords = {
      bug: ['bug', 'error', 'issue', 'problem'],
      security: ['security', 'vulnerability', 'unsafe', 'exploit'],
      performance: ['performance', 'slow', 'optimize', 'inefficient'],
      style: ['style', 'formatting', 'convention'],
      'best-practice': ['best practice', 'refactor', 'improve'],
    };

    const lines = text.toLowerCase().split('\n');
    
    lines.forEach((line) => {
      for (const [type, words] of Object.entries(keywords)) {
        if (words.some((word) => line.includes(word))) {
          findings.push({
            type: type as any,
            severity: line.includes('critical') || line.includes('high') ? 'high' : 
                     line.includes('medium') ? 'medium' : 'low',
            file: 'various',
            description: line.trim().substring(0, 150),
          });
          break;
        }
      }
    });

    return findings.slice(0, 10); // Limit to 10 findings
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const recommendSection = this.extractSection(text, 'Recommendations') || 
                            this.extractSection(text, 'Suggestions');

    if (recommendSection) {
      const lines = recommendSection.split('\n');
      lines.forEach((line) => {
        const cleaned = line.replace(/^[-*\d.)\s]+/, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      });
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private determineAssessment(
    text: string,
    findings: ReviewFinding[],
  ): 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' {
    const lowerText = text.toLowerCase();

    // Check for explicit assessment
    if (lowerText.includes('approve') && !lowerText.includes('not approve')) {
      return 'APPROVE';
    }
    if (lowerText.includes('request changes') || lowerText.includes('needs changes')) {
      return 'REQUEST_CHANGES';
    }

    // Determine based on findings
    const highSeverityCount = findings.filter((f) => f.severity === 'high').length;
    const bugOrSecurityCount = findings.filter(
      (f) => f.type === 'bug' || f.type === 'security',
    ).length;

    if (highSeverityCount > 0 || bugOrSecurityCount > 2) {
      return 'REQUEST_CHANGES';
    }

    return 'COMMENT';
  }

  private truncateDiff(diff: string, maxLength: number = 4000): string {
    if (diff.length <= maxLength) {
      return diff;
    }
    return diff.substring(0, maxLength) + '\n\n... (diff truncated for review)';
  }

  private getReviewLabel(assessment: string): string {
    const labels = {
      APPROVE: 'review:approved',
      REQUEST_CHANGES: 'review:changes-requested',
      COMMENT: 'review:commented',
    };
    return labels[assessment] || 'review:pending';
  }
}