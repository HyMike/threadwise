/**
 * Main entry point for the Threadwise application
 * 
 * This file can start both the server and cron, or just one depending on environment variables.
 * 
 * Usage:
 * - Run API server only: npm run dev
 * - Run cron only: npm run dev:cron  
 * - Run both: npm run dev:all
 */

import { cronOrchestrator } from './jobs/cronOrchestrator';

// Start the server
import './server';

// Optionally start the cron scheduler
if (process.env.ENABLE_CRON === 'true') {
  const schedule = process.env.CRON_SCHEDULE || '*/15 * * * *';
  console.log('Starting cron orchestrator...');
  cronOrchestrator.start(schedule);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});