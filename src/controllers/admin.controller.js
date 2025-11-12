import * as analyticsService from '../services/analytics.service.js';

export const getOverviewAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getOverviewAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getTrendingAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

export const getClickAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getClickAnalytics(req.query);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

