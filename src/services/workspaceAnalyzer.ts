import { LLMFactory } from "../providers/llmFactory";
import {
  slackClient,
  ThreadMessage,
} from "../clients/slack";
import { LLMClient, LLMMessage } from "../types/llmProvider.types";
import { config } from "../utils/config";
import {
  EnhancedThreadContext,
  CategorizingThread,
  SummaryResponse,
} from "@/types/threadAnalysis.types";
import { JiraTasks, JiraTasksObj } from "@/types/jira.types";
import { categorizingPrompt } from "../prompts/filterPrompt";
import {
  questionAnswerPrompt,
  technicalIssuePrompt,
  decisionDiscussionPrompt,
  statusUpdatePrompt,
} from "../prompts/categoriesPrompts";
import { MESSAGE_STATUSES } from "../constants/statuses";
import { buildResolvedSummary } from "../helpers/buildResolvedSummary";
import { taskExtractionPrompt } from "../prompts/filterPrompt";
import { jiraClient, JiraClientManager } from "../clients/jira";

interface Workspace {
  id: string;
  teamId: string;
  channels: string[];
  settings: {
    threadThreshold: number;
  };
}

interface AnalysisResult {
  workspaceId: string;
  processedThreads: number;
  timestamp: Date;
}

export class WorkspaceAnalyzer {
  private userNameCache = new Map<string, string>();

  /**
   * Analyze a single workspace
   */
  async analyzeWorkspace(workspaceId: string): Promise<AnalysisResult> {
    const workspace = await this.getWorkspace(workspaceId);
    let processedCount = 0;

    try {
      // Cache user names for this workspace
      this.userNameCache = await slackClient.getAllUsersInWorkSpace(workspace.id);

      // Process each channel
      for (const channelId of workspace.channels) {
        const threads = await slackClient.getThreadRoots(channelId, workspace.id);

        for (const thread of threads) {
          if (this.shouldProcessThread(thread, workspace.settings)) {
            await this.processThread(thread, channelId, workspace);
            processedCount++;
          }
        }
      }

      return {
        workspaceId: workspace.id,
        processedThreads: processedCount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error analyzing workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze all workspaces (used for manual triggers)
   */
  async analyzeAllWorkspaces(): Promise<AnalysisResult[]> {
    const workspaces = await this.getAllWorkspaces();
    const results: AnalysisResult[] = [];

    const CHUNK_SIZE = 5;
    for (let i = 0; i < workspaces.length; i += CHUNK_SIZE) {
      const chunk = workspaces.slice(i, i + CHUNK_SIZE);

      const chunkResults = await Promise.allSettled(
        chunk.map(workspace => this.analyzeWorkspace(workspace.id))
      );

      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to analyze workspace ${chunk[index].id}:`, result.reason);
          results.push({
            workspaceId: chunk[index].id,
            processedThreads: 0,
            timestamp: new Date()
          });
        }
      });
    }

    return results;
  }

  private async getWorkspace(workspaceId: string): Promise<Workspace> {
    // TODO: Implement database query
    // For now, return the hardcoded workspace
    return {
      id: workspaceId,
      teamId: workspaceId,
      channels: ["C06KQR10T4N"],
      settings: {
        threadThreshold: 2,
      },
    };
  }

  private async getAllWorkspaces(): Promise<Workspace[]> {
    // TODO: Implement database query
    // For now, return hardcoded workspace
    return [
      {
        id: "default",
        teamId: "default",
        channels: ["C06KQR10T4N"],
        settings: {
          threadThreshold: 2,
        },
      },
    ];
  }

  private shouldProcessThread(thread: ThreadMessage, settings: any): boolean {
    return (thread.reply_count || 0) > settings.threadThreshold;
  }

  private async processThread(
    thread: ThreadMessage,
    channelId: string,
    workspace: Workspace
  ) {
    try {
      const messages = await slackClient.getThreadMessages(
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
          reactions: thread.reactions, //this is just the root reactions.
          is_locked: thread.is_locked,
        },
        messages: await Promise.all(
          messages.map(async (msg) => {
            let userName = this.userNameCache.get(msg.user);
            if (!userName) {
              userName = await slackClient.getUserName(msg.user, workspace.id);
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
      const { category } = threadCategorized;

      const promptMap = {
        technical_issue: technicalIssuePrompt,
        question_answer: questionAnswerPrompt,
        decision_discussion: decisionDiscussionPrompt,
        status_update: statusUpdatePrompt,
      };

      console.log(`Thread category: ${category}`);

      if (!!category && category !== "casual_chat") {
        //  still need to handle the case here of resolution being resolved.
        //what if they are not summarized yet but they're turn out to be resolved. We don't want to create jira ticket for those.
        const extractedTask: JiraTasksObj = await this.extractTasks(
          llmClient,
          taskExtractionPrompt,
          enhancedContext
        );
        console.log(extractedTask);
        await jiraClient.createIssueInBacklog(workspace.id, extractedTask);

        const summarizedResponse = await this.summarizeResponse(
          llmClient,
          promptMap[category],
          threadCategorized,
          enhancedContext
        );

        const { summary, status } = summarizedResponse;
        const resolvedSummary = buildResolvedSummary(summarizedResponse);

        if (status === MESSAGE_STATUSES.RESOLVED) {
          await slackClient.postStatusUpdate({
            channelId,
            resolvedSummary,
            threadTs: thread.ts,
            workspaceId: workspace.id,
            fallBackSummary: summary,
          });
          await slackClient.addCheckmark(channelId, thread.ts, workspace.id);
        } else if (
          status === MESSAGE_STATUSES.UNRESOLVED ||
          status === MESSAGE_STATUSES.IN_PROGRESS
        ) {
          await slackClient.postStatusUpdate({
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
      throw error;
    }
  }

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
      console.error(`Error categorizing thread:`, error);
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

  private async extractTasks(
    llmClient: LLMClient,
    prompt: LLMMessage,
    enhancedContext: EnhancedThreadContext
  ): Promise<JiraTasksObj> {
    try {
      const extractedTask = await llmClient.generateResponse([
        prompt,
        {
          role: "user",
          content: `Analyze this technical issue thread:
          Thread Data: ${JSON.stringify(enhancedContext, null, 2)}`,
        },
      ]);
      return JSON.parse(extractedTask.content);
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
}
