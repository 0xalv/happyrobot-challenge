import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { classificationService } from '../services/classification.service';
import { sentimentService } from '../services/sentiment.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * HappyRobot Webhook Handler
 * Receives call completion data from HappyRobot platform
 * Orchestrates classification, sentiment analysis, and data storage
 */
router.post('/happyrobot', async (req: Request, res: Response) => {
  try {
    console.log('\n📞 ===== HappyRobot Webhook Received =====');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

    const {
      call_id,
      mc_number,
      carrier_name,
      load_id,
      final_price,
      transcript,
      call_start,
      call_end,
      duration,
    } = req.body;

    // Validate required fields
    if (!call_id) {
      console.error('❌ Missing required field: call_id');
      return res.status(400).json({
        error: 'Missing required field: call_id',
      });
    }

    console.log(`\n🔍 Processing call: ${call_id}`);
    console.log(`   MC Number: ${mc_number || 'N/A'}`);
    console.log(`   Load: ${load_id || 'N/A'}`);
    console.log(`   Final Price: ${final_price ? '$' + final_price : 'N/A'}`);

    // Step 1: Classify call outcome
    console.log('\n--- Step 1: Classification ---');
    const classification = classificationService.classifyOutcome({
      transcript,
      load_id,
      final_price,
      mc_number,
      call_duration: duration,
    });

    // Step 2: Analyze sentiment
    console.log('\n--- Step 2: Sentiment Analysis ---');
    const sentimentAnalysis = sentimentService.analyzeSentiment({
      transcript,
      outcome: classification.outcome,
      call_duration: duration,
    });

    // Step 3: Store call data in database
    console.log('\n--- Step 3: Storing Data ---');
    const call = await prisma.call.create({
      data: {
        call_id,
        mc_number: mc_number || null,
        carrier_name: carrier_name || null,
        load_id: load_id || null,
        final_price: final_price || null,
        outcome: classification.outcome,
        outcome_reason: classification.outcome_reason,
        sentiment: sentimentAnalysis.sentiment,
        sentiment_score: sentimentAnalysis.sentiment_score,
        duration: duration || null,
        transcript: transcript || null,
        call_start: call_start ? new Date(call_start) : null,
        call_end: call_end ? new Date(call_end) : null,
      },
    });

    console.log(`\n✅ Call saved to database: ${call.id}`);
    console.log('\n📊 Results:');
    console.log(`   Outcome: ${classification.outcome}`);
    console.log(`   Reason: ${classification.outcome_reason}`);
    console.log(`   Sentiment: ${sentimentAnalysis.sentiment} (${sentimentAnalysis.sentiment_score})`);
    console.log('\n===== Webhook Processing Complete =====\n');

    // Return success response
    return res.status(200).json({
      success: true,
      call_id: call.call_id,
      database_id: call.id,
      classification: {
        outcome: classification.outcome,
        outcome_reason: classification.outcome_reason,
        confidence: classification.confidence,
      },
      sentiment: {
        sentiment: sentimentAnalysis.sentiment,
        score: sentimentAnalysis.sentiment_score,
        indicators: sentimentAnalysis.indicators,
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
 * Get call by ID
 */
router.get('/calls/:call_id', async (req: Request, res: Response) => {
  try {
    const { call_id } = req.params;

    const call = await prisma.call.findUnique({
      where: { call_id },
    });

    if (!call) {
      return res.status(404).json({
        error: 'Call not found',
        call_id,
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
