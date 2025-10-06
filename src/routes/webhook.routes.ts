import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * HappyRobot Webhook Handler
 * Receives call completion data from HappyRobot platform
 * Stores data directly from HappyRobot's AI Classify and AI Extract nodes
 */
router.post('/happyrobot', async (req: Request, res: Response) => {
  try {
    console.log('\n📞 ===== HappyRobot Webhook Received =====');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

    const {
      call_id,              // HappyRobot sends this automatically, we just ignore it
      run_id,               // Run ID from HappyRobot for tracking
      mc_number,
      carrier,
      load_id,
      final_price,
      outcome,              // From HappyRobot AI Classify #1
      outcome_reason,       // From HappyRobot AI Extract
      sentiment,            // From HappyRobot AI Classify #2
      negotiation_rounds,   // From HappyRobot AI Extract
      transcript,
      call_end,
      duration,
    } = req.body;

    console.log(`\n🔍 Processing call data:`);
    console.log(`   MC Number: ${mc_number || 'N/A'}`);
    console.log(`   Carrier: ${carrier || 'N/A'}`);
    console.log(`   Load: ${load_id || 'N/A'}`);
    console.log(`   Final Price: ${final_price ? '$' + final_price : 'N/A'}`);
    console.log(`   Outcome: ${outcome || 'N/A'}`);
    console.log(`   Outcome Reason: ${outcome_reason || 'N/A'}`);
    console.log(`   Sentiment: ${sentiment || 'N/A'}`);
    console.log(`   Negotiation Rounds: ${negotiation_rounds || 'N/A'}`);

    // Store call data in database
    console.log('\n--- Storing Data ---');
    const call = await prisma.call.create({
      data: {
        run_id: run_id || null,
        mc_number: mc_number ? String(mc_number) : null,
        carrier: carrier || null,
        load_id: load_id || null,
        final_price: final_price && final_price !== "" ? (typeof final_price === 'string' ? parseFloat(final_price) : final_price) : null,
        outcome: outcome || null,
        outcome_reason: outcome_reason || null,
        sentiment: sentiment || null,
        negotiation_rounds: negotiation_rounds && negotiation_rounds !== "" ? (typeof negotiation_rounds === 'string' ? parseInt(negotiation_rounds) : negotiation_rounds) : null,
        duration: duration || null,
        transcript: Array.isArray(transcript) ? JSON.stringify(transcript) : (transcript || null),
        call_end: call_end ? new Date(call_end) : null,
      },
    });

    console.log(`\n✅ Call saved to database: ${call.id}`);
    console.log('\n📊 Call Data:');
    console.log(`   Outcome: ${call.outcome}`);
    console.log(`   Outcome Reason: ${call.outcome_reason}`);
    console.log(`   Sentiment: ${call.sentiment}`);
    console.log(`   Negotiation Rounds: ${call.negotiation_rounds}`);

    // Log CALL_ENDED event to CallActivity if run_id is provided
    if (run_id) {
      await prisma.callActivity.create({
        data: {
          run_id,
          event_type: 'CALL_ENDED',
          data: {
            mc_number,
            carrier,
            load_id,
            final_price,
            outcome,
            outcome_reason,
            sentiment,
            negotiation_rounds,
            duration,
            call_end,
            database_call_id: call.id,
          },
        },
      });
      console.log(`✅ CallActivity logged: CALL_ENDED for run ${run_id}`);
    }

    console.log('\n===== Webhook Processing Complete =====\n');

    // Return success response
    return res.status(200).json({
      success: true,
      database_id: call.id,
      data: {
        outcome: call.outcome,
        outcome_reason: call.outcome_reason,
        sentiment: call.sentiment,
        negotiation_rounds: call.negotiation_rounds,
        final_price: call.final_price,
      },
    });
  } catch (error) {
    console.error('\n🚨 Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all calls
 */
router.get('/calls', async (req: Request, res: Response) => {
  try {
    const calls = await prisma.call.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 calls
    });

    return res.status(200).json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get call by database ID
 */
router.get('/calls/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { id },
    });

    if (!call) {
      return res.status(404).json({
        error: 'Call not found',
        id,
      });
    }

    return res.status(200).json({
      success: true,
      call,
    });
  } catch (error) {
    console.error('Error fetching call:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
