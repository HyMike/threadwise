import { JiraTasks, JiraTasksObj } from "../types/jira.types";
import axios, { AxiosInstance } from "axios";
import { JiraConfig } from "../types/jira.types";
import { config } from "../utils/config";

export class JiraClientManager {
  private static instance: JiraClientManager;
  private workspaceClients: Map<string, JiraConfig> = new Map();
  private defaultConfig: JiraConfig | null = null;

  private constructor() {
    if (config.jiraAuth) {
      this.defaultConfig = {
        jiraBaseUrl: config.jiraAuth.jiraBaseUrl,
        email: config.jiraAuth.email,
        apiToken: config.jiraAuth.apiToken,
        projectKey: config.jiraAuth.projectKey,
        boardId:
          typeof config.jiraAuth.boardId === "string"
            ? parseInt(config.jiraAuth.boardId)
            : config.jiraAuth.boardId,
      };
    }
  }

  public static getInstance(): JiraClientManager {
    if (!JiraClientManager.instance) {
      JiraClientManager.instance = new JiraClientManager();
    }
    return JiraClientManager.instance;
  }

  public registerWorkspace(workspaceId: string, config: JiraConfig): void {
    this.workspaceClients.set(workspaceId, config);
  }

  private getConfig(workspaceId?: string): JiraConfig {
    // If workspaceId provided, try to get workspace-specific config
    if (workspaceId) {
      const workspaceConfig = this.workspaceClients.get(workspaceId);
      if (workspaceConfig) {
        return workspaceConfig;
      }
    }

    // Fall back to default config from global config
    if (this.defaultConfig) {
      return this.defaultConfig;
    }

    throw new Error(
      workspaceId
        ? `Jira config not found for workspace ${workspaceId} and no default config available`
        : "No Jira configuration available"
    );
  }

  private createAxiosInstance(config: JiraConfig): AxiosInstance {
    return axios.create({
      baseURL: config.jiraBaseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${config.email}:${config.apiToken}`
        ).toString("base64")}`,
      },
    });
  }

  async createIssue(workspaceId: string, task: JiraTasksObj): Promise<string> {
    const config = this.getConfig(workspaceId);
    const axiosInstance = this.createAxiosInstance(config);

    try {
      const { summary, description } = task.tasks[0];

      const response = await axiosInstance.post("/rest/api/3/issue", {
        fields: {
          project: { key: config.projectKey },
          summary: summary,
          description: description,
          issuetype: {
            name: "Task",
          },
        },
      });

      return response.data.key;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : error.message;
        throw new Error(`Failed to create Jira issue: ${errorMessage}`);
      }
      throw error;
    }
  }

  // already add to backlog automatically. Don't really need this. There an issue with it being the correct board even though it's the right one.
  // leaving here to see if there is an edge case in which you have multiple backlog and want to select a specific board.

  //   async addToBacklog(workspaceId: string, issueKey: string): Promise<void> {
  //     const config = this.getConfig(workspaceId);
  //     const axiosInstance = this.createAxiosInstance(config);

  //     try {
  //         await axiosInstance.post(
  //           `/rest/agile/1.0/board/${config.boardId}/backlog/issue`,
  //           {
  //             issues: [issueKey]
  //           }
  //         );
  //       } catch (error: any) {
  //         if (axios.isAxiosError(error)) {
  //             throw new Error(
  //                 `Board ${config.boardId} not found. Please verify the board ID is correct. ` +
  //                 `The board should be accessible at: ${config.jiraBaseUrl}/jira/software/projects/${config.projectKey}/boards/${config.boardId}`
  //               );
  //         }
  //         throw error;
  //       }
  //     }

  async createIssueInBacklog(
    workspaceId: string,
    task: JiraTasksObj
  ): Promise<string> {
    const issueKey = await this.createIssue(workspaceId, task);
    // await this.addToBacklog(workspaceId, issueKey);
    return issueKey;
  }
}

export const jiraClient = JiraClientManager.getInstance();