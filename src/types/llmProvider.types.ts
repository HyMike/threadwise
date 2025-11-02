export type LLMProvider = "openai" | "openrouter";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  // not sure if we need this at all
  // usage?: {
  //     prompt_token: number;
  //     completion_tokens: number;
  //     total_token: number;

  // }
}

export interface LLMClient {
  generateResponse(messages: LLMMessage[]): Promise<LLMResponse>;
}
