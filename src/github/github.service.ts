import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { PullRequestData, FileChange } from '../types/pr.types';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.owner = this.configService.get<string>('GITHUB_OWNER');
    this.repo = this.configService.get<string>('GITHUB_REPO');

    this.octokit = new Octokit({ auth: token });
    this.logger.log('GitHub service initialized');
  }

  async getPullRequest(prNumber: number): Promise<PullRequestData> {
    try {
      const { data } = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || '',
        author: data.user?.login || 'unknown',
        branch: data.head.ref,
        baseBranch: data.base.ref,
        state: data.state,
        url: data.html_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      this.logger.error(`Failed to get PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  async getPullRequestFiles(prNumber: number): Promise<FileChange[]> {
    try {
      const { data } = await this.octokit.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      return data.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get files for PR #${prNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDiff(prNumber: number): Promise<string> {
    try {
      const { data } = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        mediaType: {
          format: 'diff',
        },
      });

      return data as unknown as string;
    } catch (error) {
      this.logger.error(`Failed to get diff for PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  async createReviewComment(
    prNumber: number,
    body: string,
  ): Promise<void> {
    try {
      await this.octokit.pulls.createReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        body,
        event: 'COMMENT',
      });

      this.logger.log(`Posted review comment on PR #${prNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to post review comment on PR #${prNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async addLabel(prNumber: number, label: string): Promise<void> {
    try {
      await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        labels: [label],
      });

      this.logger.log(`Added label "${label}" to PR #${prNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to add label to PR #${prNumber}: ${error.message}`,
      );
    }
  }
}