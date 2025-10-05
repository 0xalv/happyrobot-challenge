import { Router, Request, Response } from 'express';
import { loadService } from '../services/load.service';

const router = Router();

// Search loads by origin, destination, equipment_type
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { origin, destination, equipment_type } = req.query;

    // Validate at least one search parameter is provided
    if (!origin && !destination && !equipment_type) {
      return res.status(400).json({
        error: 'At least one search parameter is required',
        params: ['origin', 'destination', 'equipment_type'],
      });
    }

    const loads = await loadService.searchLoads({
      origin: origin as string | undefined,
      destination: destination as string | undefined,
      equipment_type: equipment_type as string | undefined,
    });

    return res.status(200).json({
      success: true,
      count: loads.length,
      loads,
    });
  } catch (error) {
    console.error('Error in load search endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get load by ID
router.get('/:loadId', async (req: Request, res: Response) => {
  try {
    const { loadId } = req.params;

    const load = await loadService.getLoadById(loadId);

    if (!load) {
      return res.status(404).json({
        error: 'Load not found',
        loadId,
      });
    }

    return res.status(200).json({
      success: true,
      load,
    });
  } catch (error) {
    console.error('Error in get load endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
