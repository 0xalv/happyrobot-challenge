import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import carrierRoutes from './routes/carrier.routes';
import loadRoutes from './routes/load.routes';
import negotiationRoutes from './routes/negotiation.routes';
import webhookRoutes from './routes/webhook.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { apiKeyAuth } from './middleware/auth.middleware';
import { autoSeedDatabase } from './utils/autoSeed';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (PUBLIC - No API key required)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HappyRobot Carrier Sales API'
  });
});

// Protected API Routes (API key required)
app.use('/api/carrier', apiKeyAuth, carrierRoutes);
app.use('/api/loads', apiKeyAuth, loadRoutes);
app.use('/api/negotiation', apiKeyAuth, negotiationRoutes);
app.use('/api/webhooks', apiKeyAuth, webhookRoutes);
app.use('/api/dashboard', apiKeyAuth, dashboardRoutes);

// Start server with auto-seed
async function startServer() {
  // Auto-seed database if empty
  await autoSeedDatabase();

  // Start listening
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 FMCSA verify: POST http://localhost:${PORT}/api/carrier/verify/:mc`);
    console.log(`🚚 Load search: GET http://localhost:${PORT}/api/loads/search?origin=X&destination=Y`);
    console.log(`💰 Negotiation: POST http://localhost:${PORT}/api/negotiation/evaluate`);
    console.log(`📞 Webhook: POST http://localhost:${PORT}/api/webhooks/happyrobot`);
    console.log(`📈 Dashboard Activity: GET http://localhost:${PORT}/api/dashboard/activity`);
    console.log(`📉 Dashboard Metrics: GET http://localhost:${PORT}/api/dashboard/metrics`);
  });
}

startServer();

export default app;
