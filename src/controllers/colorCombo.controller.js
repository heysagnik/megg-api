import * as colorComboService from '../services/colorCombo.service.js';
import { validate } from '../middleware/validate.js';
import { createColorComboSchema, updateColorComboSchema } from '../validators/colorCombo.validators.js';

export const listColorCombos = async (req, res, next) => {
  try {
    const { group } = req.query;
    const combos = await colorComboService.listColorCombos(group || null);

    res.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.json({
      success: true,
      data: combos
    });
  } catch (error) {
    next(error);
  }
};

export const getColorComboProducts = async (req, res, next) => {
  try {
    const result = await colorComboService.getColorComboProducts(req.params.id);

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createColorCombo = async (req, res, next) => {
  try {
    const { name, color_a, color_b, group_type, product_ids } = req.body;

    await validate(createColorComboSchema)({ body: req.body }, res, () => { });

    let modelImageUrl = null;
    if (req.files && req.files.length > 0) {
      const modelFile = req.files.find(f => f.fieldname === 'model_image');
      if (modelFile) {
        const { uploadColorComboImage } = await import('../services/upload.service.js');
        const tempId = `temp_${Date.now()}`;
        modelImageUrl = await uploadColorComboImage(modelFile, tempId);
      }
    }

    const comboData = {
      name,
      color_a,
      color_b,
      group_type: group_type || null,
      model_image: modelImageUrl,
      product_ids: product_ids || []
    };

    const combo = await colorComboService.createColorCombo(comboData);

    res.status(201).json({ success: true, data: combo });
  } catch (error) {
    next(error);
  }
};

export const updateColorCombo = async (req, res, next) => {
  try {
    await validate(updateColorComboSchema)({ params: req.params, body: req.body }, res, () => { });

    const updates = { ...req.body };

    if (req.files && req.files.length > 0) {
      const modelFile = req.files.find(f => f.fieldname === 'model_image');
      if (modelFile) {
        const { uploadColorComboImage } = await import('../services/upload.service.js');
        const modelImageUrl = await uploadColorComboImage(modelFile, req.params.id);
        updates.model_image = modelImageUrl;
      }
    }

    const combo = await colorComboService.updateColorCombo(req.params.id, updates);
    res.json({ success: true, data: combo });
  } catch (error) {
    next(error);
  }
};

export const deleteColorCombo = async (req, res, next) => {
  try {
    await colorComboService.deleteColorCombo(req.params.id);

    res.json({ success: true, message: 'Color combo deleted' });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedColorCombos = async (req, res, next) => {
  try {
    const combos = await colorComboService.getRecommendedColorCombos(req.params.id);

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({
      success: true,
      data: combos
    });
  } catch (error) {
    next(error);
  }
};

