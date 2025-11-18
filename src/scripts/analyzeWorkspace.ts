#!/usr/bin/env node
/**
 * Standalone worker script for Kubernetes jobs
 *
 * This script is executed by K8s jobs to analyze a single workspace.
 * It makes an API call to the main threadwise API server.
 *
 * Usage: node dist/scripts/analyzeWorkspace.js <workspaceId>
 */

import axios from "axios";

async function main() {
  const workspaceId = process.argv[2] || process.env.WORKSPACE_ID;
  const apiUrl = process.env.API_URL || "http://localhost:3000";

  // Validate inputs
  if (!workspaceId) {
    console.error("ERROR: Workspace ID not provided");
    console.error("Usage: node analyzeWorkspace.js <workspaceId>");
    console.error("   OR: Set WORKSPACE_ID environment variable");
    process.exit(1);
  }

  if (!apiUrl) {
    console.error("ERROR: API_URL environment variable not set");
    process.exit(1);
  }

  console.log(`Starting workspace analysis`);
  console.log(`  Workspace ID: ${workspaceId}`);
  console.log(`  API URL: ${apiUrl}`);
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);

  try {
    const startTime = Date.now();

    const response = await axios.post(
      `${apiUrl}/api/workspaces/${workspaceId}/analyze`,
      {},
      {
        timeout: 300000, // 5 minute timeout
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "threadwise-k8s-worker",
        },
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.success) {
      console.log(`✅ Analysis completed successfully in ${duration}ms`);
      console.log(`Result:`, JSON.stringify(response.data.result, null, 2));
      process.exit(0);
    } else {
      console.error(`❌ Analysis failed: ${response.data.error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Analysis failed with error:`, error.message);

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else if (error.request) {
      console.error(`   No response received from API`);
    } else {
      console.error(`   Error details:`, error);
    }

    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main();
