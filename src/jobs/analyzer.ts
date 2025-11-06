import { LLMFactory } from "../providers/llmFactory";
import {
  slackClient,
  SlackClientManager,
  ThreadMessage,
} from "../clients/slack";
import { LLMClient, LLMMessage } from "../types/llmProvider.types";
import { config } from "../utils/config";
import {
  EnhancedThreadContext,
  CategorizingThread,
  SummaryResponse,
} from "@/types/threadAnalysis.types";
import { categorizingPrompt } from "../prompts/filterPrompt";
import {
  questionAnswerPrompt,
  technicalIssuePrompt,
  decisionDiscussionPrompt,
  statusUpdatePrompt,
} from "../prompts/categoriesPrompts";
import { FallbackEncoder } from "openai/internal/request-options";
import { MESSAGE_STATUSES } from "../constants/statuses";
import { buildResolvedSummary } from "../helpers/buildResolvedSummary";

// src/jobs/threadAnalyzer.ts
interface Workspace {
  id: string;
  teamId: string;
  channels: string[];
  settings: {
    threadThreshold: number;
    // other workspace-specific settings
  };
}

export class ThreadAnalyzerJob {
  private slackClient: SlackClientManager;
  private userNameCache = new Map<string, string>(); // id, real_name

  constructor() {
    this.slackClient = slackClient;
  }

  async processAllWorkspaces() {
    try {
      // 1. Get all active workspaces from DB
      //   const workspaces = await db.workspaces.findAll({
      //     where: { isActive: true }
      //   }); // TO-DO: Implement database lookup for workspaces, hardcoding sample for now
      const workspaces = [
        {
          id: null as unknown as string,
          channels: ["C06KQR10T4N"],
          settings: {
            threadThreshold: 2,
          },
        },
      ];

      // 2. Process workspaces in chunks to avoid memory issues
      const CHUNK_SIZE = 5;
      for (let i = 0; i < workspaces.length; i += CHUNK_SIZE) {
        const chunk = workspaces.slice(i, i + CHUNK_SIZE);

        // Process chunk concurrently
        await Promise.all(
          chunk.map((workspace) =>
            this.processWorkspace(workspace as Workspace)
          )
        );
      }
    } catch (error) {
      console.error("Error processing workspaces:", error);
    }
  }

  async processWorkspace(workspace: Workspace) {
    try {
      this.userNameCache = await this.slackClient.getAllUsersInWorkSpace(
        workspace.id
      );
      // Process each channel in the workspace
      for (const channelId of workspace.channels) {
        // Get threads using workspace-specific client
        const threads = await this.slackClient.getThreadRoots(
          channelId,
          workspace.id
        );

        // Process each thread
        for (const thread of threads) {
          // console.log("thread", thread);
          if (this.shouldProcessThread(thread, workspace.settings)) {
            // console.log("processing thread", thread);
            await this.processThread(thread, channelId, workspace);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing workspace ${workspace.id}:`, error);
      // Log workspace error for monitoring
      await console.error(`Error processing workspace ${workspace.id}:`, error);
    }
  }

  private shouldProcessThread(thread: ThreadMessage, settings: any): boolean {
    return (thread.reply_count || 0) > settings.threadThreshold;
  }

  private async processThread(
    thread: ThreadMessage,
    channelId: string,
    workspace: Workspace
  ) {
    // this.slackClient.removeMessage(channelId, workspace.id,'p1762133256169839');

    try {
      const messages = await this.slackClient.getThreadMessages(
        channelId,
        thread.ts,
        workspace.id
      );

      const llmClient: LLMClient = LLMFactory.createClient(config.llm);

      const enhancedContext: EnhancedThreadContext = {
        thread: {
          text: thread.text,
          user: thread.user,
          reply_count: thread.reply_count,
          reply_users_count: thread.reply_users_count,
          reply_users: thread.reply_users,
          reactions: thread.reactions,
          is_locked: thread.is_locked,
        },
        messages: await Promise.all(
          messages.map(async (msg) => {
            let userName = this.userNameCache.get(msg.user);
            if (!userName) {
              userName = await this.slackClient.getUserName(
                msg.user,
                workspace.id
              );
              this.userNameCache.set(msg.user, userName);
            }
            return {
              user: msg.user,
              userName: userName,
              text: msg.text,
              timestamp: msg.ts,
            };
          })
        ),
      };

      const threadCategorized: CategorizingThread =
        await this.categorizeThreads(llmClient, enhancedContext);
      const { category, tone, resolution } = threadCategorized;

      const promptMap = {
        technical_issue: technicalIssuePrompt,
        question_answer: questionAnswerPrompt,
        decision_discussion: decisionDiscussionPrompt,
        status_update: statusUpdatePrompt,
      };

      console.log(`filteredThread category: ${category}`);

      if (!!category && category !== "casual_chat") {
        const summarizedResponse = await this.summarizeResponse(
          llmClient,
          promptMap[category],
          threadCategorized,
          enhancedContext
        );

        const { summary, status } = summarizedResponse;
        // Return formatted resolved, unresolved or in progress summary for slack base on the status.
        const resolvedSummary = buildResolvedSummary(summarizedResponse);
        if (status === MESSAGE_STATUSES.RESOLVED) {
          await this.slackClient.postStatusUpdate({
            channelId,
            resolvedSummary,
            threadTs: thread.ts,
            workspaceId: workspace.id,
            fallBackSummary: summary,
          });
          await this.slackClient.addCheckmark(
            channelId,
            thread.ts,
            workspace.id
          );
        } else if (status === MESSAGE_STATUSES.UNRESOLVED || status === MESSAGE_STATUSES.IN_PROGRESS) {
          
          await this.slackClient.postStatusUpdate({
            channelId,
            resolvedSummary,
            threadTs: thread.ts,
            workspaceId: workspace.id,
            fallBackSummary: summary,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing thread ${thread.ts}:`, error);
    }
  }

  /**
   * Takes thread message to process by a llm and return the category,
   * @param llmClient
   * @param enhancedContext
   * @returns
   */
  private async categorizeThreads(
    llmClient: LLMClient,
    enhancedContext: EnhancedThreadContext
  ): Promise<CategorizingThread> {
    try {
      const response = await llmClient.generateResponse([
        categorizingPrompt,
        {
          role: "user",
          content: `Classify this Slack thread:
          Thread data: ${JSON.stringify(enhancedContext, null, 2)}`,
        },
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      console.error(`Error filtering thread:`, error);
      throw error;
    }
  }

  private async summarizeResponse(
    llmClient: LLMClient,
    prompt: LLMMessage,
    filteredThreadCategory: CategorizingThread,
    enhancedContext: EnhancedThreadContext
  ): Promise<SummaryResponse> {
    try {
      const summaryResponse = await llmClient.generateResponse([
        prompt,
        {
          role: "user",
          content: `Analyze this technical issue thread:
        Thread Data: ${JSON.stringify(enhancedContext, null, 2)}
        Filter Results: ${JSON.stringify(filteredThreadCategory, null, 2)}`,
        },
      ]);
      console.log(JSON.parse(summaryResponse.content));
      return JSON.parse(summaryResponse.content);
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
}
