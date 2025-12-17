import express from 'express';
import * as outfitController from '../controllers/outfit.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import {
  createOutfitSchema,
  updateOutfitSchema,
  outfitIdSchema
} from '../validators/outfit.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', generalLimiter, outfitController.listOutfits);
router.get('/:id', generalLimiter, validate(outfitIdSchema), outfitController.getOutfit);

// Admin routes (API key required)
router.post('/', apiKeyAuth, adminLimiter, validate(createOutfitSchema), outfitController.createOutfit);
router.put('/:id', apiKeyAuth, adminLimiter, validate(updateOutfitSchema), outfitController.updateOutfit);
router.delete('/:id', apiKeyAuth, adminLimiter, validate(outfitIdSchema), outfitController.deleteOutfit);

export default router;
