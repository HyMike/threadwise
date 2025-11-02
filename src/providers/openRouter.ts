import {
  LLMClient,
  LLMConfig,
  LLMMessage,
  LLMResponse,
} from "@/types/llmProvider.types";

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private temperature: number;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "openrouter/auto";
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.temperature = config.temperature || 0.7;
  }

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: this.temperature,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as OpenRouterResponse;

    return {
      content: data.choices[0]?.message?.content || "",
    };
  }
}
