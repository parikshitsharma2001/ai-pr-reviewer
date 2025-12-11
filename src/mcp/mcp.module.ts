import { Module, OnModuleInit } from '@nestjs/common';
import { McpClientService } from './mcp-client.service';
import { mcpServersConfig } from '../config/mcp.config';

@Module({
  providers: [McpClientService],
  exports: [McpClientService],
})
export class McpModule implements OnModuleInit {
  constructor(private readonly mcpClient: McpClientService) {}

  onModuleInit() {
    // Register all MCP servers on module initialization
    Object.entries(mcpServersConfig).forEach(([serverId, config]) => {
      this.mcpClient.registerServer(serverId, config);
    });
  }
}