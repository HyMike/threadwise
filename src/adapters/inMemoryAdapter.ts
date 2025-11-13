import axios from 'axios';
import { ExecutionAdapter, WorkspaceExecutionResult } from './executionAdapter';
import { config } from '../utils/config';

export class InMemoryAdapter implements ExecutionAdapter {
  private apiUrl: string;

  constructor() {
    const port = config.server.port;
    const host = config.server.host;
    this.apiUrl = process.env.API_URL || `http://${host}:${port}`;
  }

  async executeWorkspace(workspaceId: string): Promise<WorkspaceExecutionResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/workspaces/${workspaceId}/analyze`,
        {},
        {
          timeout: 60000, // 60 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        workspaceId,
        success: response.data.success === true,
        error: response.data.error
      };
    } catch (error: any) {
      return {
        workspaceId,
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  async executeWorkspaces(workspaceIds: string[]): Promise<WorkspaceExecutionResult[]> {
    const results = await Promise.allSettled(
      workspaceIds.map(id => this.executeWorkspace(id))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          workspaceId: workspaceIds[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }
}
