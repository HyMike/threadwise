/**
 * Execution adapter interface for running workspace analysis
 * Supports both in-memory (direct API calls) and Kubernetes jobs
 */

export interface WorkspaceExecutionResult {
  workspaceId: string;
  success: boolean;
  error?: string;
}

export interface ExecutionAdapter {
  /**
   * Execute analysis for a single workspace
   */
  executeWorkspace(workspaceId: string): Promise<WorkspaceExecutionResult>;

  /**
   * Execute analysis for multiple workspaces
   */
  executeWorkspaces(workspaceIds: string[]): Promise<WorkspaceExecutionResult[]>;

  /**
   * Clean up resources (optional)
   */
  cleanup?(): Promise<void>;
}
