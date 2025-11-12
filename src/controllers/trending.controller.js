import * as trendingService from '../services/trending.service.js';

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
    await trendingService.trackProductClick(req.params.productId, userId);

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};

