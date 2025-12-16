import express from 'express';
import * as colorComboController from '../controllers/colorCombo.controller.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadModelImageHandler } from '../middleware/upload.js';
import { colorComboIdSchema, createColorComboSchema, updateColorComboSchema } from '../validators/colorCombo.validators.js';

const router = express.Router();

router.get('/', generalLimiter, colorComboController.listColorCombos);
router.get('/:id/products', generalLimiter, validate(colorComboIdSchema), colorComboController.getColorComboProducts);
router.get('/:id/recommendations', generalLimiter, validate(colorComboIdSchema), colorComboController.getRecommendedColorCombos);

router.post('/', authenticate, requireAdmin, adminLimiter, uploadModelImageHandler, validate(createColorComboSchema), colorComboController.createColorCombo);
router.put('/:id', authenticate, requireAdmin, adminLimiter, uploadModelImageHandler, validate(updateColorComboSchema), colorComboController.updateColorCombo);
router.delete('/:id', authenticate, requireAdmin, adminLimiter, validate(colorComboIdSchema), colorComboController.deleteColorCombo);

export default router;

