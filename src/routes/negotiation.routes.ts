import { Router, Request, Response } from 'express';
import { negotiationService } from '../services/negotiation.service';

const router = Router();

// Evaluate carrier offer
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { call_id, load_id, loadboard_rate, carrier_offer, round } = req.body;

    // Validate required fields
    if (!load_id || !loadboard_rate || !carrier_offer || round === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['load_id', 'loadboard_rate', 'carrier_offer', 'round'],
      });
    }

    // Validate data types
    if (typeof loadboard_rate !== 'number' || typeof carrier_offer !== 'number' || typeof round !== 'number') {
      return res.status(400).json({
        error: 'Invalid data types',
        details: 'loadboard_rate, carrier_offer, and round must be numbers',
      });
    }

    // Validate round is positive
    if (round < 1) {
      return res.status(400).json({
        error: 'Invalid round number',
        details: 'round must be >= 1',
      });
    }

    const result = await negotiationService.evaluateOffer({
      call_id,
      load_id,
      loadboard_rate,
      carrier_offer,
      round,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in negotiation evaluate endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get negotiation history for a call
router.get('/history/:call_id', async (req: Request, res: Response) => {
  try {
    const { call_id } = req.params;

    const history = await negotiationService.getNegotiationHistory(call_id);

    return res.status(200).json({
      success: true,
      call_id,
      count: history.length,
      negotiations: history,
    });
  } catch (error) {
    console.error('Error in negotiation history endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all negotiations for a load
router.get('/load/:load_id', async (req: Request, res: Response) => {
  try {
    const { load_id } = req.params;

    const negotiations = await negotiationService.getNegotiationsByLoad(load_id);

    return res.status(200).json({
      success: true,
      load_id,
      count: negotiations.length,
      negotiations,
    });
  } catch (error) {
    console.error('Error in load negotiations endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
