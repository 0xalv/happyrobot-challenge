import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import carrierRoutes from './routes/carrier.routes';
import loadRoutes from './routes/load.routes';
import negotiationRoutes from './routes/negotiation.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HappyRobot Carrier Sales API'
  });
});

// Routes
app.use('/api/carrier', carrierRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/negotiation', negotiationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 FMCSA verify: POST http://localhost:${PORT}/api/carrier/verify/:mc`);
  console.log(`🚚 Load search: GET http://localhost:${PORT}/api/loads/search?origin=X&destination=Y`);
  console.log(`💰 Negotiation: POST http://localhost:${PORT}/api/negotiation/evaluate`);
});

export default app;
