import * as bannerService from '../services/banner.service.js';

export const listBanners = async (req, res, next) => {
  try {
    const category = req.query.category || null;
    const banners = await bannerService.listBanners(category);

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

export const getBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.getBannerById(req.params.id);

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body, req.file);

    res.status(201).json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.updateBanner(req.params.id, req.body, req.file);

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    await bannerService.deleteBanner(req.params.id);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

