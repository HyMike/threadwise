import { ThreadAnalyzerJob } from "./jobs/analyzer";

async function runThreadAnalysis() {
  const job = new ThreadAnalyzerJob();
  await job.processAllWorkspaces();
}

runThreadAnalysis();
