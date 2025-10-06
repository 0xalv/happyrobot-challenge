import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard/activity
 * Returns recent call activities for real-time dashboard updates
 */
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const { limit = '50', run_id } = req.query;

    const whereClause = run_id ? { run_id: run_id as string } : {};

    const activities = await prisma.callActivity.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error('Error fetching dashboard activity:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/dashboard/metrics
 * Returns aggregated metrics for dashboard
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Total calls
    const totalCalls = await prisma.call.count();

    // Calls by outcome
    const callsByOutcome = await prisma.call.groupBy({
      by: ['outcome'],
      _count: {
        outcome: true,
      },
    });

    // Calls by sentiment
    const callsBySentiment = await prisma.call.groupBy({
      by: ['sentiment'],
      _count: {
        sentiment: true,
      },
    });

    // Average negotiation rounds
    const avgNegotiationRounds = await prisma.call.aggregate({
      _avg: {
        negotiation_rounds: true,
      },
    });

    // Success rate (BOOKED / total)
    const bookedCalls = await prisma.call.count({
      where: { outcome: 'BOOKED' },
    });
    const successRate = totalCalls > 0 ? (bookedCalls / totalCalls) * 100 : 0;

    // Average final price
    const avgFinalPrice = await prisma.call.aggregate({
      _avg: {
        final_price: true,
      },
      where: {
        final_price: {
          not: null,
        },
      },
    });

    // Recent activities count by type
    const recentActivities = await prisma.callActivity.groupBy({
      by: ['event_type'],
      _count: {
        event_type: true,
      },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return res.status(200).json({
      success: true,
      metrics: {
        total_calls: totalCalls,
        success_rate: parseFloat(successRate.toFixed(2)),
        booked_calls: bookedCalls,
        avg_negotiation_rounds: avgNegotiationRounds._avg.negotiation_rounds || 0,
        avg_final_price: avgFinalPrice._avg.final_price || 0,
        calls_by_outcome: callsByOutcome.reduce((acc, item) => {
          acc[item.outcome || 'UNKNOWN'] = item._count.outcome;
          return acc;
        }, {} as Record<string, number>),
        calls_by_sentiment: callsBySentiment.reduce((acc, item) => {
          acc[item.sentiment || 'UNKNOWN'] = item._count.sentiment;
          return acc;
        }, {} as Record<string, number>),
        recent_activities_24h: recentActivities.reduce((acc, item) => {
          acc[item.event_type] = item._count.event_type;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/dashboard/sessions
 * Returns all active sessions with their latest activity
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    // Get unique run_ids with their latest and first activity timestamps
    const sessions = await prisma.callActivity.groupBy({
      by: ['run_id'],
      _max: {
        timestamp: true,
      },
      _min: {
        timestamp: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _max: {
          timestamp: 'desc',
        },
      },
      take: 50,
    });

    // Get the latest activity for each run and check if call has ended
    const sessionDetails = await Promise.all(
      sessions.map(async (session) => {
        const latestActivity = await prisma.callActivity.findFirst({
          where: { run_id: session.run_id },
          orderBy: { timestamp: 'desc' },
        });

        // Check if session has a CALL_ENDED event
        const callEndedEvent = await prisma.callActivity.findFirst({
          where: {
            run_id: session.run_id,
            event_type: 'CALL_ENDED',
          },
        });

        return {
          run_id: session.run_id,
          latest_timestamp: session._max.timestamp,
          first_timestamp: session._min.timestamp,
          total_activities: session._count.id,
          latest_event_type: latestActivity?.event_type,
          has_ended: !!callEndedEvent,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: sessionDetails.length,
      sessions: sessionDetails,
    });
  } catch (error) {
    console.error('Error fetching dashboard sessions:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
