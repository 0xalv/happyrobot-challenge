import { Router, Request, Response } from 'express';
import { negotiationService } from '../services/negotiation.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Evaluate carrier offer
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { load_id, loadboard_rate, carrier_offer, round, run_id } = req.body;

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
      run_id,
      load_id,
      loadboard_rate,
      carrier_offer,
      round,
    });

    // Log negotiation activity
    if (run_id) {
      await prisma.callActivity.create({
        data: {
          run_id,
          event_type: 'NEGOTIATION_ROUND',
          data: {
            load_id,
            round,
            carrier_offer,
            loadboard_rate,
            action: result.action,
            counter_offer: result.counter_offer,
            reason: result.reason,
            negotiation_id: result.negotiation_id,
          },
        },
      });
      console.log(`✅ CallActivity logged: NEGOTIATION_ROUND ${round} - ${result.action} for run ${run_id}`);
    }

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

// Get negotiation history for a run
router.get('/history/:run_id', async (req: Request, res: Response) => {
  try {
    const { run_id } = req.params;

    const history = await negotiationService.getNegotiationHistory(run_id);

    return res.status(200).json({
      success: true,
      run_id,
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

// Accept load (handles both direct acceptance and post-negotiation acceptance)
router.post('/accept-load', async (req: Request, res: Response) => {
  try {
    const { load_id, loadboard_rate, run_id } = req.body;

    // Validate required fields
    if (!load_id || !loadboard_rate) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['load_id', 'loadboard_rate'],
      });
    }

    // Validate data types
    if (typeof loadboard_rate !== 'number') {
      return res.status(400).json({
        error: 'Invalid data types',
        details: 'loadboard_rate must be a number',
      });
    }

    // Verify load exists
    const load = await prisma.load.findUnique({
      where: { load_id },
    });

    if (!load) {
      return res.status(404).json({
        error: 'Load not found',
        load_id,
      });
    }

    // Check if there's prior negotiation for this load and run
    const priorNegotiation = await prisma.negotiation.findFirst({
      where: {
        load_id,
        run_id: run_id || null,
        round: { gt: 0 }, // Exclude round=0 (direct acceptances)
      },
      orderBy: { round: 'desc' },
    });

    let negotiation;
    let eventType: string;
    let eventData: any;
    let acceptedPrice: number;

    if (priorNegotiation && priorNegotiation.counter_offer) {
      // There was prior negotiation - carrier is accepting our counter-offer
      const nextRound = priorNegotiation.round + 1;
      acceptedPrice = priorNegotiation.counter_offer;

      negotiation = await prisma.negotiation.create({
        data: {
          run_id: run_id || null,
          load_id,
          round: nextRound,
          carrier_offer: acceptedPrice,
          counter_offer: null,
          action: 'ACCEPT',
          reason: `Carrier accepted broker's counter-offer of $${acceptedPrice}`,
        },
      });

      eventType = 'NEGOTIATION_ROUND';
      eventData = {
        load_id,
        round: nextRound,
        carrier_offer: acceptedPrice,
        loadboard_rate,
        action: 'ACCEPT',
        counter_offer: null,
        reason: negotiation.reason,
        negotiation_id: negotiation.id,
      };

      console.log(`✅ CallActivity logged: NEGOTIATION_ROUND ${nextRound} - ACCEPT for run ${run_id}`);
    } else {
      // No prior negotiation - direct acceptance of loadboard rate
      acceptedPrice = loadboard_rate;

      negotiation = await prisma.negotiation.create({
        data: {
          run_id: run_id || null,
          load_id,
          round: 0, // 0 indicates direct acceptance without negotiation
          carrier_offer: loadboard_rate,
          counter_offer: null,
          action: 'ACCEPT',
          reason: 'Carrier accepted loadboard rate without negotiation',
        },
      });

      eventType = 'LOAD_ACCEPTED';
      eventData = {
        load_id,
        loadboard_rate,
        accepted_price: loadboard_rate,
        negotiation_id: negotiation.id,
      };

      console.log(`✅ CallActivity logged: LOAD_ACCEPTED (direct acceptance) for run ${run_id}`);
    }

    // Log activity
    if (run_id) {
      await prisma.callActivity.create({
        data: {
          run_id,
          event_type: eventType,
          data: eventData,
        },
      });
    }

    return res.status(200).json({
      success: true,
      negotiation_id: negotiation.id,
      action: 'ACCEPT',
      accepted_price: acceptedPrice,
      message: priorNegotiation
        ? `Load accepted at negotiated price of $${acceptedPrice}`
        : 'Load accepted without negotiation',
    });
  } catch (error) {
    console.error('Error in negotiation accept endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
