import * as outfitService from '../services/outfit.service.js';

export const listOutfits = async (req, res, next) => {
  try {
    const outfits = await outfitService.listOutfits();

    res.json({
      success: true,
      data: { outfits }
    });
  } catch (error) {
    next(error);
  }
};

export const getOutfit = async (req, res, next) => {
  try {
    const outfit = await outfitService.getOutfitById(req.params.id);

    res.json({
      success: true,
      data: outfit
    });
  } catch (error) {
    next(error);
  }
};

export const createOutfit = async (req, res, next) => {
  try {
    const outfit = await outfitService.createOutfit(req.body);

    res.status(201).json({
      success: true,
      data: outfit
    });
  } catch (error) {
    next(error);
  }
};

export const updateOutfit = async (req, res, next) => {
  try {
    const outfit = await outfitService.updateOutfit(req.params.id, req.body);

    res.json({
      success: true,
      data: outfit
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOutfit = async (req, res, next) => {
  try {
    await outfitService.deleteOutfit(req.params.id);

    res.json({
      success: true,
      message: 'Outfit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
