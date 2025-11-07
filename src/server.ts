import express, { Request, Response, NextFunction } from 'express';
import { config } from './utils/config';
import { workspaceAnalyzerRouter } from './routes/analyzer';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    environment: config.environment,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/workspaces', workspaceAnalyzerRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error'
  });
});

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});

export default app;
