import { Router, Request, Response } from 'express';
import { fmcsaService } from '../services/fmcsa.service';

const router = Router();

// Verificar carrier por MC number
router.post('/verify/:mc', async (req: Request, res: Response) => {
  try {
    const { mc } = req.params;

    if (!mc) {
      return res.status(400).json({ error: 'MC number is required' });
    }

    const carrier = await fmcsaService.verifyCarrier(mc);

    if (!carrier) {
      return res.status(404).json({
        error: 'Carrier not found',
        mcNumber: mc,
      });
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
