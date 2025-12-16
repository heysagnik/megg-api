import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import { toNodeHandler } from 'better-auth/node'; // Better Auth
import { auth } from './config/auth.js';

app.all('/api/auth/*', toNodeHandler(auth));
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fashion Discovery API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      outfits: '/api/outfits',
      colorCombos: '/api/color-combos',
      trending: '/api/trending',
      offers: '/api/offers',
      guides: '/api/guides',
      reels: '/api/reels',
      wishlist: '/api/wishlist',
      admin: '/api/admin'
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
