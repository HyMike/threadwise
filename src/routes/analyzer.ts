import { Router, Request, Response } from 'express';
import { WorkspaceAnalyzer } from '../services/workspaceAnalyzer';

const router = Router();
const analyzer = new WorkspaceAnalyzer();

/**
 * Analyze a specific workspace
 * POST /api/workspaces/:workspaceId/analyze
 */
router.post('/:workspaceId/analyze', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    
    console.log(`Analyzing workspace: ${workspaceId}`);
    const result = await analyzer.analyzeWorkspace(workspaceId);
    
    res.json({ 
      success: true, 
      result 
    });
  } catch (error: any) {
    console.error(`Error analyzing workspace ${req.params.workspaceId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
});

export { router as workspaceAnalyzerRouter };
