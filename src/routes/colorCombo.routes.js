import express from 'express';
import * as colorComboController from '../controllers/colorCombo.controller.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { uploadModelImageHandler } from '../middleware/upload.js';
import { colorComboIdSchema, createColorComboSchema, updateColorComboSchema } from '../validators/colorCombo.validators.js';

const router = express.Router();

// Public routes
router.get('/', generalLimiter, colorComboController.listColorCombos);
router.get('/:id/products', generalLimiter, validate(colorComboIdSchema), colorComboController.getColorComboProducts);
router.get('/:id/recommendations', generalLimiter, validate(colorComboIdSchema), colorComboController.getRecommendedColorCombos);

// Admin routes (API key required)
router.post('/', apiKeyAuth, adminLimiter, uploadModelImageHandler, validate(createColorComboSchema), colorComboController.createColorCombo);
router.put('/:id', apiKeyAuth, adminLimiter, uploadModelImageHandler, validate(updateColorComboSchema), colorComboController.updateColorCombo);
router.delete('/:id', apiKeyAuth, adminLimiter, validate(colorComboIdSchema), colorComboController.deleteColorCombo);

export default router;
