import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import outfitRoutes from './outfit.routes.js';
import colorComboRoutes from './colorCombo.routes.js';
import trendingRoutes from './trending.routes.js';
import offerRoutes from './offer.routes.js';
import reelRoutes from './reel.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import adminRoutes from './admin.routes.js';
import searchRoutes from './search.routes.js';
import uploadRoutes from './upload.routes.js';
import bannerRoutes from './banner.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/search', searchRoutes);
router.use('/outfits', outfitRoutes);
router.use('/color-combos', colorComboRoutes);
router.use('/trending', trendingRoutes);
router.use('/offers', offerRoutes);
router.use('/reels', reelRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/banners', bannerRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

export default router;

