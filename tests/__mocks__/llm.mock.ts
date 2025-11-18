/**
 * Mock LLM client for testing
 */

export const mockLLMClient = {
  generateResponse: jest.fn().mockResolvedValue({
    content: JSON.stringify({
      category: "technical_issue",
      tone: "professional",
      resolution: "resolved",
      summary: "Test summary",
      status: "resolved",
      keyPoints: ["Point 1", "Point 2"],
      actionItems: [],
    }),
  }),
};

export const mockLLMFactory = {
  createClient: jest.fn().mockReturnValue(mockLLMClient),
};

// Mock the LLM factory
jest.mock("../../src/providers/llmFactory", () => ({
  LLMFactory: mockLLMFactory,
}));
