import { WebClient, ErrorCode, UsersListResponse } from "@slack/web-api";
import { config, isSingleWorkspace } from "../utils/config";
import { mapUserNames } from "../helpers/mapUserNames";

export interface ThreadMessage {
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  text: string;
  user: string;
  reply_users_count?: number;
  reply_users?: string[];
  reactions?: string;
  is_locked?: boolean;
}

export class SlackClientManager {
  private static instance: SlackClientManager;
  private defaultClient?: WebClient;
  private workspaceClients: Map<string, WebClient> = new Map();

  private constructor() {
    if (isSingleWorkspace(config.auth)) {
      this.defaultClient = new WebClient(config.auth.botToken);
    }
  }

  public static getInstance(): SlackClientManager {
    if (!SlackClientManager.instance) {
      SlackClientManager.instance = new SlackClientManager();
    }
    return SlackClientManager.instance;
  }

  private async getClient(workspaceId?: string): Promise<WebClient> {
    if (isSingleWorkspace(config.auth)) {
      return this.defaultClient!;
    }

    if (!workspaceId) {
      throw new Error("workspaceId is required in multi-workspace mode");
    }

    if (!this.workspaceClients.has(workspaceId)) {
      // TODO: Implement database lookup for workspace bot token
      const workspace = {
        botToken: "your_bot_token_here",
      }; // await db.workspaces.findOne(workspaceId);
      if (!workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
      }
      this.workspaceClients.set(workspaceId, new WebClient(workspace.botToken));
    }

    return this.workspaceClients.get(workspaceId)!;
  }

  // Thread-related methods now support multi-workspace
  async getThreadRoots(
    channelId: string,
    workspaceId?: string
  ): Promise<ThreadMessage[]> {
    try {
      const client = await this.getClient(workspaceId);
      const response = await client.conversations.history({
        channel: channelId,
        limit: 100,
      });

      if (!response.ok || !response.messages) {
        throw new Error("Failed to fetch conversation history");
      }

      return response.messages
        .filter((msg) => (msg.reply_count ?? 0) > 0 && msg.ts)
        .map((msg) => msg as ThreadMessage);
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }
  }

  async getThreadMessages(
    channelId: string,
    threadTs: string,
    workspaceId?: string
  ): Promise<ThreadMessage[]> {
    try {
      const client = await this.getClient(workspaceId);
      const response = await client.conversations.replies({
        channel: channelId,
        ts: threadTs,
      });

      if (!response.ok || !response.messages) {
        throw new Error("Failed to fetch thread messages");
      }

      return response.messages as ThreadMessage[];
    } catch (error) {
      console.error("Error fetching thread:", error);
      return [];
    }
  }

  async addCheckmark(
    channelId: string,
    ts: string,
    workspaceId?: string
  ): Promise<void> {
    try {
      const client = await this.getClient(workspaceId);
      // await client.reactions.remove({
      //   channel: channelId,
      //   name: 'white_check_mark',
      //   timestamp: ts,
      // })
      await client.reactions.add({
        channel: channelId,
        name: "white_check_mark",
        timestamp: ts,
      });
    } catch (error: any) {
      if (
        error.code === ErrorCode.PlatformError &&
        error.data?.error === "already_reacted"
      ) {
        return; // Ignore if already reacted
      }
      console.error("Error adding reaction:", error);
    }
  }

  async postStatusUpdate({
    channelId,
    threadTs,
    workspaceId,
    summary,
  }: {
    channelId: string;
    threadTs: string;
    workspaceId?: string;
    summary?: string;
  }): Promise<void> {
    try {
      const client = await this.getClient(workspaceId);

      await client.chat.postMessage({
        channel: channelId,
        text: summary,
        thread_ts: threadTs,
      });
    } catch (error: any) {}
  }

  async getUserName(userId: string, workspaceId?: string): Promise<string> {
    try {
      const client = await this.getClient(workspaceId);
      const response = await client.users.info({ user: userId });

      if (response.ok && response.user) {
        return (
          response.user.profile?.real_name ||
          response.user.profile?.display_name ||
          response.user.name ||
          "Someone"
        );
      }
      return "Someone";
    } catch (error) {
      console.warn("Error fetching user info:", error);
      return userId;
    }
  }

  async getAllUsersInWorkSpace(
    workspaceId: string
  ): Promise<Map<string, string>> {
    try {
      const client = await this.getClient(workspaceId);
      const workspaceUsers = await client.users.list();
      const workSpaceUsersList = workspaceUsers?.members;
      const userNameMap = mapUserNames(workSpaceUsersList);
      return userNameMap;
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  //   async removeMessage(
  //     channelId: string,
  //     workspaceId: string,
  //     ts: string
  //   ): Promise<void> {
  //     const no_p = ts.substring(1); // remove 'p' -> '1761273885443439'
  //     const timestamp = no_p.slice(0, 10) + '.' + no_p.slice(10);

  //     try{
  //       const client = await this.getClient(workspaceId);
  //       await client.chat.delete({
  //         channel: channelId,
  //         ts:timestamp
  //       })

  //     } catch(error) {
  //       console.error(`Cannot delete message: ${error}`);

  //     }
  //   }
}

// Export singleton instance
export const slackClient = SlackClientManager.getInstance();
