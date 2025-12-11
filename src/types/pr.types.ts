export interface PullRequestData {
    id: number;
    number: number;
    title: string;
    body: string;
    author: string;
    branch: string;
    baseBranch: string;
    state: string;
    url: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface FileChange {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }
  
  export interface ReviewResult {
    summary: string;
    findings: ReviewFinding[];
    recommendations: string[];
    assessment: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    rawReview: string;
  }
  
  export interface ReviewFinding {
    type: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
    severity: 'high' | 'medium' | 'low';
    file: string;
    line?: number;
    description: string;
    suggestion?: string;
  }
  
  export interface McpToolCall {
    name: string;
    arguments: Record<string, any>;
  }
  
  export interface McpResponse {
    success: boolean;
    data?: any;
    error?: string;
  }