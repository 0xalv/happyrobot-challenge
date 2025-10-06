import { Request, Response, NextFunction } from 'express';

/**
 * API Key Authentication Middleware
 * Validates x-api-key header against environment variable
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY;

  // Check if API_KEY is configured
  if (!expectedApiKey) {
    console.error('⚠️ API_KEY environment variable is not set!');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API authentication not configured'
    });
  }

  // Check if API key is provided
  if (!apiKey) {
    console.log('❌ API key missing in request');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Please include x-api-key header.'
    });
  }

  // Validate API key
  if (apiKey !== expectedApiKey) {
    console.log('❌ Invalid API key provided');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  // API key is valid, proceed
  console.log('✅ API key validated successfully');
  next();
};
