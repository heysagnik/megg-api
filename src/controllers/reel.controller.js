import * as reelService from '../services/reel.service.js';

export const listAllReels = async (req, res, next) => {
  try {
    const reels = await reelService.listAllReels();

    res.json({
      success: true,
      data: reels
    });
  } catch (error) {
    next(error);
  }
};

export const listReelsByCategory = async (req, res, next) => {
  try {
    const reels = await reelService.listReelsByCategory(req.params.category);

    res.json({
      success: true,
      data: reels
    });
  } catch (error) {
    next(error);
  }
};

export const getReelWithProducts = async (req, res, next) => {
  try {
    const reel = await reelService.getReelWithProducts(req.params.id);

    res.json({
      success: true,
      data: reel
    });
  } catch (error) {
    next(error);
  }
};

export const createReel = async (req, res, next) => {
  try {
    const reel = await reelService.createReel(req.body);

    res.status(201).json({
      success: true,
      data: reel
    });
  } catch (error) {
    next(error);
  }
};

export const updateReel = async (req, res, next) => {
  try {
    const reel = await reelService.updateReel(req.params.id, req.body);

    res.json({
      success: true,
      data: reel
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReel = async (req, res, next) => {
  try {
    await reelService.deleteReel(req.params.id);

    res.json({
      success: true,
      message: 'Reel deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const incrementViews = async (req, res, next) => {
  try {
    await reelService.incrementReelViews(req.params.id);

    res.json({
      success: true,
      message: 'View count updated'
    });
  } catch (error) {
    next(error);
  }
};

export const incrementLikes = async (req, res, next) => {
  try {
    const isLike = req.body && Object.prototype.hasOwnProperty.call(req.body, 'like') ? Boolean(req.body.like) : true;
    const userId = req.user ? req.user.id : null;

    if (isLike) {
      await reelService.incrementReelLikes(req.params.id);
      if (userId) {
        await reelService.trackUserLike(req.params.id, userId);
      }
      res.json({ success: true, message: 'Like count updated' });
    } else {
      await reelService.decrementReelLikes(req.params.id);
      if (userId) {
        await reelService.untrackUserLike(req.params.id, userId);
      }
      res.json({ success: true, message: 'Like count decreased' });
    }
  } catch (error) {
    next(error);
  }
};

export const getLikedReels = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const reels = await reelService.getLikedReelsByUser(req.user.id);

    res.json({
      success: true,
      data: reels
    });
  } catch (error) {
    next(error);
  }
};

