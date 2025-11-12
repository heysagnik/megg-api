import express from 'express';
import * as outfitController from '../controllers/outfit.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOutfitSchema,
  updateOutfitSchema,
  outfitIdSchema
} from '../validators/outfit.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', generalLimiter, outfitController.listOutfits);
router.get('/:id', generalLimiter, validate(outfitIdSchema), outfitController.getOutfit);

router.post('/', authenticate, requireAdmin, adminLimiter, validate(createOutfitSchema), outfitController.createOutfit);
router.put('/:id', authenticate, requireAdmin, adminLimiter, validate(updateOutfitSchema), outfitController.updateOutfit);
router.delete('/:id', authenticate, requireAdmin, adminLimiter, validate(outfitIdSchema), outfitController.deleteOutfit);

export default router;

