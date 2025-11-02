import { OpenAI } from "openai";
import {
  LLMClient,
  LLMConfig,
  LLMMessage,
  LLMResponse,
} from "@/types/llmProvider.types";

export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private model: string;
  private temperature: number | undefined;
  private maxTokens?: number;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || "gpt-4";
    this.temperature = config.temperature || undefined;
    this.maxTokens = config.maxTokens;
  }

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: { type: "json_object" },
    });

    return {
      content: response.choices[0]?.message?.content || "",
    };
  }
}
