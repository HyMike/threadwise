import { LLMClient, LLMConfig } from "@/types/llmProvider.types";
import { OpenAIClient } from "./openAI";
import { OpenRouterClient } from "./openRouter";

export class LLMFactory {
  static createClient(config: LLMConfig): LLMClient {
    switch (config.provider) {
      case "openai":
        return new OpenAIClient(config);
      case "openrouter":
        return new OpenRouterClient(config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
