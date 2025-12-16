import * as trendingService from '../services/trending.service.js';
import * as productService from '../services/product.service.js';

export const getTrendingProducts = async (req, res, next) => {
  try {
    const products = await trendingService.getTrendingProducts();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const trackClick = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { productId } = req.params;

    // Track user history (if logged in) and global counter
    await Promise.all([
      trendingService.trackProductClick(productId, userId),
      productService.incrementProductClicks(productId)
    ]);

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};

