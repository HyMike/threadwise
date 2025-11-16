import axios from "axios";

// Import mocks - these must be imported before the modules they mock
import "../__mocks__/slackClient.mock";
import "../__mocks__/llm.mock";
import { mockSlackClient } from "../__mocks__/slackClient.mock";
import { mockLLMClient } from "../__mocks__/llm.mock";

/**
 * API Integration Tests for Workspace Analyzer
 *
 * NOTE: THESE TESTS MAKE API CALLS TO THE LLM
 *
 * These tests make actual API calls but mock external dependencies (Slack, LLM).
 * Make sure the API server is running before executing these tests.
 *
 * Run with: npm test
 * Or specific file: npm test -- workspaceAnalyzer.test.ts
 */

const API_URL = process.env.API_URL || "http://localhost:3000";
const WORKSPACE_ID = process.env.TEST_WORKSPACE_ID || "default";

describe("Workspace Analyzer API", () => {
  beforeAll(() => {
    console.log(`Testing API at: ${API_URL}`);
    console.log(`Test workspace: ${WORKSPACE_ID}`);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("Health Check", () => {
    it("should return 200 and status ok", async () => {
      console.log(`Testing health check at: ${API_URL}/health`);
      const response = await axios.get(`${API_URL}/health`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe("ok");
      expect(response.data).toHaveProperty("environment");
      expect(response.data).toHaveProperty("timestamp");
    });
  });

  describe("POST /api/workspaces/:workspaceId/analyze", () => {
    it("should analyze a workspace successfully", async () => {
      console.log(
        `Testing analyze workspace at: ${API_URL}/api/workspaces/${WORKSPACE_ID}/analyze`
      );
      const response = await axios.post(
        `${API_URL}/api/workspaces/${WORKSPACE_ID}/analyze`,
        {},
        { timeout: 120000 } // 2 minute timeout for LLM processing
      );
      console.log(`Response: ${JSON.stringify(response.data)}`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty("result");
      expect(response.data.result).toHaveProperty("workspaceId");
      expect(response.data.result).toHaveProperty("processedThreads");
      expect(response.data.result).toHaveProperty("timestamp");
    }, 180000); // 3 minute Jest timeout

    it("should handle concurrent requests", async () => {
      const requests = [
        axios.post(
          `${API_URL}/api/workspaces/${WORKSPACE_ID}/analyze`,
          {},
          { timeout: 120000 }
        ),
        axios.post(
          `${API_URL}/api/workspaces/${WORKSPACE_ID}/analyze`,
          {},
          { timeout: 120000 }
        ),
      ];

      const responses = await Promise.allSettled(requests);

      // At least one should succeed
      const succeeded = responses.filter((r) => r.status === "fulfilled");
      expect(succeeded.length).toBeGreaterThan(0);
    }, 180000);
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      try {
        await axios.get(`${API_URL}/api/invalid-endpoint`);
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it("should handle malformed requests gracefully", async () => {
      try {
        await axios.post(
          `${API_URL}/api/workspaces/${WORKSPACE_ID}/analyze`,
          "invalid json",
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
