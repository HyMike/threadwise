import cron from 'node-cron';
import { config, ExecutionMode } from '../utils/config';
import { ExecutionAdapter } from '../adapters/executionAdapter';
import { ExecutionAdapterFactory } from '../adapters/executionAdapterFactory';

interface Workspace {
  id: string;
  channels: string[];
}

class CronOrchestrator {
  private executionAdapter: ExecutionAdapter;
  private isRunning: boolean = false;

  constructor() {
    // Create the appropriate execution adapter based on config
    this.executionAdapter = ExecutionAdapterFactory.createAdapter();
    console.log(`CronOrchestrator initialized with ${config.execution.mode} execution mode`);
  }

  /**
   * Trigger workspace analysis using the configured execution adapter
   */
  async triggerWorkspaceAnalysis(): Promise<void> {
    if (this.isRunning) {
      console.log('Analysis already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`[${new Date().toISOString()}] Starting workspace analysis cycle`);
      console.log(`Execution mode: ${config.execution.mode}`);
      
      // Get all workspaces from database
      const workspaces = await this.getAllWorkspaces();
      console.log(`Found ${workspaces.length} workspaces to analyze`);

      // Execute analysis using the configured adapter
      const workspaceIds = workspaces.map(w => w.id);
      const results = await this.executionAdapter.executeWorkspaces(workspaceIds);

      // Log results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      console.log(`Analysis cycle completed in ${duration}ms`);
      console.log(`Results: ${successful} successful, ${failed} failed`);

      // Log failed workspaces
      results.forEach(result => {
        if (!result.success) {
          console.error(`Failed to analyze workspace ${result.workspaceId}: ${result.error}`);
        }
      });

      // Cleanup if supported (for K8s adapter)
      if (this.executionAdapter.cleanup) {
        await this.executionAdapter.cleanup();
      }

    } catch (error) {
      console.error('Error in analysis cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get all workspaces from database
   */
  private async getAllWorkspaces(): Promise<Workspace[]> {
    // TODO: Implement database query
    // For now, return hardcoded workspace
    return [
      {
        id: 'default',
        channels: ['C06KQR10T4N']
      }
    ];
  }

  /**
   * Start the cron scheduler
   */
  start(schedule: string = '*/15 * * * *'): void {
    console.log(`Starting cron orchestrator with schedule: ${schedule}`);

    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    // Schedule the job
    cron.schedule(schedule, () => {
      this.triggerWorkspaceAnalysis();
    });

    console.log('✅ Cron orchestrator started successfully');

    // Optional: Run immediately on start
    if (process.env.RUN_ON_START === 'true') {
      console.log('Running initial analysis...');
      this.triggerWorkspaceAnalysis();
    }
  }

  /**
   * Manually trigger analysis (for testing)
   */
  async runOnce(): Promise<void> {
    await this.triggerWorkspaceAnalysis();
  }
}

export const cronOrchestrator = new CronOrchestrator();

// If this file is run directly, start the cron
if (require.main === module) {
  const schedule = process.env.CRON_SCHEDULE || '*/15 * * * *';
  cronOrchestrator.start(schedule);
}
