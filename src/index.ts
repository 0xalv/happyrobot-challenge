import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import carrierRoutes from './routes/carrier.routes';

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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 FMCSA verify: POST http://localhost:${PORT}/api/carrier/verify/:mc`);
});

export default app;
