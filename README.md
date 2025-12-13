# NestJS MCP PR Reviewer

An enterprise-grade Pull Request reviewer built with NestJS that leverages the Model Context Protocol (MCP) to orchestrate GitHub, Slack, and Ollama services for automated code reviews.

## 🏗️ Architecture

This application follows a modular architecture with the following components:

```
src/
├── config/           # Configuration files and templates
├── github/           # GitHub integration service
├── slack/            # Slack notification service
├── mcp/              # MCP client for server orchestration
├── reviewer/         # Core review logic and Ollama integration
├── webhook/          # GitHub webhook handlers
└── types/            # TypeScript type definitions
```

## 🚀 Features

- **Automated PR Reviews**: Automatically reviews pull requests when opened or updated
- **AI-Powered Analysis**: Uses Ollama LLMs to analyze code changes
- **Slack Notifications**: Sends formatted review summaries to Slack
- **GitHub Integration**: Posts reviews as comments and adds labels
- **Modular Architecture**: Clean separation of concerns with NestJS modules
- **Webhook Support**: Listens to GitHub webhooks for real-time PR events
- **Manual Triggers**: API endpoint to manually trigger reviews

## 📋 Prerequisites

- Node.js 18+ and npm
- GitHub account with a personal access token
- Slack workspace with a bot token
- Ollama installed and running locally (or accessible via URL)
- A repository to review PRs for

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-pr-reviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. **Configure credentials** (see Configuration section below)

## ⚙️ Configuration

### GitHub Configuration

1. **Create a Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control), `read:org`
   - Copy the token

2. **Update `.env` file**:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_OWNER=your_username_or_org
   GITHUB_REPO=your_repository_name
   ```

### Slack Configuration

1. **Create a Slack App**:
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "PR Reviewer Bot")

2. **Configure Bot Token Scopes**:
   - Go to "OAuth & Permissions"
   - Add scopes: `chat:write`, `chat:write.public`
   - Install app to workspace
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)

3. **Get Channel ID**:
   - Open Slack, right-click your channel → View channel details
   - Scroll to bottom, copy Channel ID

4. **Update `.env` file**:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-token-here
   SLACK_CHANNEL_ID=C01234ABCDE
   ```

### Ollama Configuration

1. **Install Ollama**:
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Or download from https://ollama.com/download
   ```

2. **Pull a model**:
   ```bash
   ollama pull llama2
   # or
   ollama pull codellama
   # or
   ollama pull mistral
   ```

3. **Start Ollama** (if not running):
   ```bash
   ollama serve
   ```

4. **Update `.env` file**:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama2
   ```

### MCP Server Configuration (Optional)

If you're using external MCP servers:

```env
GITHUB_MCP_SERVER_URL=http://localhost:3001
SLACK_MCP_SERVER_URL=http://localhost:3002
OLLAMA_MCP_SERVER_URL=http://localhost:11434
```

### Webhook Secret (Optional but Recommended)

For production environments, set a webhook secret:

```env
WEBHOOK_SECRET=your_secure_random_string
```

## 🎯 Running the Application

### Development Mode

```bash
npm run start:dev
```

The server will start on `http://localhost:3000` with hot reload enabled.

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📡 Setting Up GitHub Webhooks

To enable automatic PR reviews:

1. **Expose your local server** (for development):
   ```bash
   # Using ngrok
   ngrok http 3000
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

2. **Configure GitHub Webhook**:
   - Go to your GitHub repository
   - Settings → Webhooks → Add webhook
   - Payload URL: `https://your-domain.com/webhook/github`
   - Content type: `application/json`
   - Secret: (your `WEBHOOK_SECRET` from .env)
   - Events: Select "Pull requests"
   - Click "Add webhook"

3. **Test the webhook**:
   - Open or update a PR in your repository
   - Check your application logs
   - You should see a review posted to GitHub and Slack

## 🔧 Manual Review Trigger

You can manually trigger a review via API:

```bash
curl -X POST http://localhost:3000/webhook/manual-review \
  -H "Content-Type: application/json" \
  -d '{"prNumber": 123}'
```

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/github` | POST | GitHub webhook receiver |
| `/webhook/manual-review` | POST | Manually trigger PR review |

## 🧪 Testing the Setup

1. **Test Ollama Connection**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Test GitHub Connection**:
   Create a test PR in your repository

3. **Test Slack Connection**:
   The bot should post when a PR is reviewed

4. **Manual Review Test**:
   ```bash
   curl -X POST http://localhost:3000/webhook/manual-review \
     -H "Content-Type: application/json" \
     -d '{"prNumber": YOUR_PR_NUMBER}'
   ```

## 🎨 Customization

### Review Prompt Template

Edit `src/config/mcp.config.ts` to customize the review prompt:

```typescript
export const reviewPromptTemplate = `
Your custom prompt here...
`;
```

### Review Assessment Logic

Modify `src/reviewer/reviewer.service.ts` to adjust how reviews are classified:
- `determineAssessment()` - Change approval logic
- `parseReviewResponse()` - Adjust response parsing
- `extractFindings()` - Customize finding detection

### Slack Message Format

Edit `src/slack/slack.service.ts` → `buildReviewBlocks()` to change Slack message appearance.

## 📚 Project Structure

```
nestjs-mcp-pr-reviewer/
├── src/
│   ├── config/
│   │   └── mcp.config.ts          # MCP server configs and prompts
│   ├── github/
│   │   ├── github.module.ts       # GitHub module
│   │   └── github.service.ts      # GitHub API integration
│   ├── slack/
│   │   ├── slack.module.ts        # Slack module
│   │   └── slack.service.ts       # Slack API integration
│   ├── mcp/
│   │   ├── mcp.module.ts          # MCP module
│   │   └── mcp-client.service.ts  # MCP client orchestrator
│   ├── reviewer/
│   │   ├── reviewer.module.ts     # Reviewer module
│   │   ├── reviewer.service.ts    # Core review logic
│   │   └── ollama.service.ts      # Ollama integration
│   ├── webhook/
│   │   ├── webhook.module.ts      # Webhook module
│   │   ├── webhook.controller.ts  # Webhook endpoints
│   │   └── webhook.service.ts     # Webhook processing
│   ├── types/
│   │   └── pr.types.ts            # TypeScript types
│   ├── app.module.ts              # Root application module
│   └── main.ts                    # Application entry point
├── .env.example                   # Environment template
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Troubleshooting

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### GitHub Token Issues

- Ensure token has `repo` scope
- Check token hasn't expired
- Verify owner/repo names are correct

### Slack Message Not Appearing

- Verify bot is added to the channel
- Check channel ID is correct
- Ensure bot has `chat:write` permissions

### Webhook Not Triggering

- Check webhook delivery in GitHub settings
- Verify URL is accessible (use ngrok for local dev)
- Check application logs for errors

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Always use `.env.example` as template
2. **Use webhook secrets** - Verify GitHub webhook signatures in production
3. **Rotate tokens regularly** - Update GitHub and Slack tokens periodically
4. **Limit token scopes** - Only grant necessary permissions
5. **Use HTTPS** - Always use HTTPS in production for webhooks

## 📈 Performance Tips

1. **Truncate large diffs** - Already implemented in `truncateDiff()`
2. **Use lighter models** - Try `mistral` or `codellama` for faster reviews
3. **Implement caching** - Cache PR data for repeated reviews
4. **Async processing** - Reviews run asynchronously to avoid blocking

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - See LICENSE file for details

## 🙏 ScreenShots
![WebHook of GitHub](./assets/WebHookGitHub.png)
![Service Logs](./assets/ConsoleLogs.png)
![Slack Channel](./assets/Slack.png)
