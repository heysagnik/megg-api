import * as wishlistService from '../services/wishlist.service.js';

export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getUserWishlist(req.user.id);

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const result = await wishlistService.addToWishlist(req.user.id, req.body.product_id);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    await wishlistService.removeFromWishlist(req.user.id, req.params.productId);

    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

