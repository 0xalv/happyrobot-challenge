import { Router, Request, Response } from 'express';
import { fmcsaService } from '../services/fmcsa.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Verificar carrier por MC number
router.post('/verify/:mc', async (req: Request, res: Response) => {
  try {
    const { mc } = req.params;
    const { run_id } = req.body; // Optional run_id from HappyRobot

    if (!mc) {
      return res.status(400).json({ error: 'MC number is required' });
    }

    const carrier = await fmcsaService.verifyCarrier(mc);

    if (!carrier) {
      // Log failed verification attempt
      if (run_id) {
        await prisma.callActivity.create({
          data: {
            run_id,
            event_type: 'MC_VERIFICATION_FAILED',
            data: {
              mc_number: mc,
              error: 'Carrier not found',
            },
          },
        });
      }

      return res.status(404).json({
        error: 'Carrier not found',
        mcNumber: mc,
      });
    }

    // Log successful verification as CallActivity
    if (run_id) {
      await prisma.callActivity.create({
        data: {
          run_id,
          event_type: 'MC_VERIFIED',
          data: {
            mc_number: mc,
            carrier_name: carrier.legalName,
            carrier_status: carrier.status,
            is_active: carrier.isActive,
            physical_address: carrier.physicalAddress,
          },
        },
      });
      console.log(`✅ CallActivity logged: MC_VERIFIED for run ${run_id}`);
    }

    return res.status(200).json({
      success: true,
      carrier,
    });
  } catch (error) {
    console.error('Error in carrier verification endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
