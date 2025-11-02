import { config as dotenvConfig } from "dotenv";
import { LLMProvider, LLMConfig } from "../types/llmProvider.types";

// Load environment variables from .env file
dotenvConfig();

type Environment = "development" | "staging" | "production";

// Helper function to validate environment
function validateEnvironment(env: string | undefined): Environment {
  if (!env || !["development", "staging", "production"].includes(env)) {
    console.warn(`Invalid environment: ${env}. Defaulting to development.`);
    return "development"; // Default fallback
  }
  return env as Environment;
}

// Deployment modes
enum DeploymentMode {
  SINGLE_WORKSPACE = "single",
  MULTI_WORKSPACE = "multi",
}

// Base auth config interface
interface AuthConfig {
  type: DeploymentMode;
}

// Single workspace auth config
interface SingleWorkspaceAuth extends AuthConfig {
  type: DeploymentMode.SINGLE_WORKSPACE;
  botToken: string;
  channelId: string;
}

// Multi workspace auth config (OAuth)
interface MultiWorkspaceAuth extends AuthConfig {
  type: DeploymentMode.MULTI_WORKSPACE;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Combined auth type
type SlackAuthConfig = SingleWorkspaceAuth | MultiWorkspaceAuth;

// Main config interface
interface AppConfig {
  environment: "development" | "staging" | "production";
  auth: SlackAuthConfig;
  database: {
    url: string;
    ssl: boolean;
  };
  server: {
    port: number;
    host: string;
  };
  llm: LLMConfig;
}

// Load and validate config
function loadConfig(): AppConfig {
  const deploymentMode =
    (process.env.DEPLOYMENT_MODE as DeploymentMode) ||
    DeploymentMode.SINGLE_WORKSPACE;

  const baseConfig = {
    environment: validateEnvironment(process.env.NODE_ENV),
    database: {
      url: process.env.DATABASE_URL || "sqlite://./dev.db",
      ssl: process.env.DATABASE_SSL === "true",
    },
    server: {
      port: parseInt(process.env.PORT || "3000"),
      host: process.env.HOST || "localhost",
    },
    llm: {
      provider: (process.env.LLM_PROVIDER as LLMProvider) || "openrouter",
      apiKey: process.env.LLM_API_KEY || "",
      model: process.env.LLM_MODEL,
      baseUrl: process.env.LLM_BASE_URL,
      temperature: process.env.LLM_TEMPERATURE
        ? parseFloat(process.env.LLM_TEMPERATURE)
        : undefined,
      maxTokens: process.env.LLM_MAX_TOKENS
        ? parseInt(process.env.LLM_MAX_TOKENS)
        : undefined,
    },
  };

  // Load auth config based on deployment mode
  if (deploymentMode === DeploymentMode.SINGLE_WORKSPACE) {
    if (!process.env.SLACK_BOT_TOKEN) {
      throw new Error("SLACK_BOT_TOKEN is required in single workspace mode");
    }

    return {
      ...baseConfig,
      auth: {
        type: DeploymentMode.SINGLE_WORKSPACE,
        botToken: process.env.SLACK_BOT_TOKEN,
        channelId: process.env.SLACK_CHANNEL_ID || "",
      },
    };
  } else {
    if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET) {
      throw new Error(
        "SLACK_CLIENT_ID and SLACK_CLIENT_SECRET are required in multi workspace mode"
      );
    }

    return {
      ...baseConfig,
      auth: {
        type: DeploymentMode.MULTI_WORKSPACE,
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        redirectUri:
          process.env.SLACK_REDIRECT_URI ||
          "http://localhost:3000/oauth/callback",
      },
    };
  }
}

// Export the config
export const config = loadConfig();

// Type guard helpers
export function isSingleWorkspace(
  auth: SlackAuthConfig
): auth is SingleWorkspaceAuth {
  return auth.type === DeploymentMode.SINGLE_WORKSPACE;
}

export function isMultiWorkspace(
  auth: SlackAuthConfig
): auth is MultiWorkspaceAuth {
  return auth.type === DeploymentMode.MULTI_WORKSPACE;
}
