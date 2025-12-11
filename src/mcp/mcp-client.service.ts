import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { McpServerConfig } from '../config/mcp.config';
import { McpResponse } from '../types/pr.types';

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);
  private clients: Map<string, AxiosInstance> = new Map();

  registerServer(serverId: string, config: McpServerConfig) {
    const client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for logging
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(
          `MCP Server ${config.name} error: ${error.message}`,
          error.stack,
        );
        throw error;
      },
    );

    this.clients.set(serverId, client);
    this.logger.log(`Registered MCP server: ${config.name}`);
  }

  getClient(serverId: string): AxiosInstance {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP server ${serverId} not registered`);
    }
    return client;
  }

  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, any>,
  ): Promise<McpResponse> {
    try {
      const client = this.getClient(serverId);
      this.logger.log(
        `Calling tool ${toolName} on ${serverId} with args: ${JSON.stringify(args)}`,
      );

      const response = await client.post('/tools/call', {
        name: toolName,
        arguments: args,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Tool call failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async listTools(serverId: string): Promise<McpResponse> {
    try {
      const client = this.getClient(serverId);
      const response = await client.get('/tools/list');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to list tools: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}