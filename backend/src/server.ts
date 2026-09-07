import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env.js';
import { initDatabase } from './config/database.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerDocument } from './docs/swagger.js';

import authRoutes from './routes/authRoutes.js';
import detectionRoutes from './routes/detectionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';

const app = express();

// 1. Security & Diagnostic Middleware
app.use(helmet({
  contentSecurityPolicy: false, // allows swagger-ui & maps
}));
app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 2. Global Rate Limiting
app.use('/api', apiRateLimiter);

// 3. Swagger OpenAPI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 4. Base Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'PyroGuard AI Backend REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 5. Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);

// 6. 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found. View API documentation at /api/docs`,
    errorCode: 'ENDPOINT_NOT_FOUND',
  });
});

// 7. Centralized Error Handler
app.use(errorHandler);

// 8. Server Initialization
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`  PyroGuard AI Backend API Server Running           `);
      console.log(`  Port: http://localhost:${ENV.PORT}                `);
      console.log(`  Swagger Docs: http://localhost:${ENV.PORT}/api/docs`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
};

startServer();

export default app;

