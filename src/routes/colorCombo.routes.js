import express from 'express';
import * as colorComboController from '../controllers/colorCombo.controller.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadModelImageHandler } from '../middleware/upload.js';

const router = express.Router();

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

router.get('/', generalLimiter, colorComboController.listColorCombos);
router.get('/:id/products', generalLimiter, validate(idSchema), colorComboController.getColorComboProducts);
router.get('/:id/recommendations', generalLimiter, validate(idSchema), colorComboController.getRecommendedColorCombos);

router.post('/', authenticate, requireAdmin, adminLimiter, uploadModelImageHandler, colorComboController.createColorCombo);
router.put('/:id', authenticate, requireAdmin, adminLimiter, uploadModelImageHandler, validate(idSchema), colorComboController.updateColorCombo);
router.delete('/:id', authenticate, requireAdmin, adminLimiter, validate(idSchema), colorComboController.deleteColorCombo);

export default router;

