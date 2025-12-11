export interface McpServerConfig {
    name: string;
    baseUrl: string;
    timeout?: number;
  }
  
  export const mcpServersConfig: Record<string, McpServerConfig> = {
    github: {
      name: 'GitHub MCP Server',
      baseUrl: process.env.GITHUB_MCP_SERVER_URL || 'http://localhost:3001',
      timeout: 30000,
    },
    slack: {
      name: 'Slack MCP Server',
      baseUrl: process.env.SLACK_MCP_SERVER_URL || 'http://localhost:3002',
      timeout: 30000,
    },
    ollama: {
      name: 'Ollama MCP Server',
      baseUrl: process.env.OLLAMA_MCP_SERVER_URL || 'http://localhost:11434',
      timeout: 60000,
    },
  };
  
  export const reviewPromptTemplate = `
  You are an expert code reviewer. Analyze the following pull request and provide constructive feedback.
  
  **Pull Request Information:**
  - Title: {{title}}
  - Author: {{author}}
  - Branch: {{branch}}
  - Files Changed: {{filesCount}}
  
  **Code Changes:**
  {{diff}}
  
  **Instructions:**
  1. Review code quality, readability, and best practices
  2. Identify potential bugs or security issues
  3. Suggest improvements and optimizations
  4. Provide specific, actionable feedback
  5. Be constructive and respectful
  
  Please provide a detailed review with:
  - Summary of changes
  - Key findings (bugs, security, performance)
  - Specific recommendations for each file
  - Overall assessment (Approve/Request Changes/Comment)
  
  Format your response in markdown with clear sections.
  `;