import express from 'express';
import * as offerController from '../controllers/offer.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import {
  listOffersSchema,
  createOfferSchema,
  updateOfferSchema,
  offerIdSchema
} from '../validators/offer.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { uploadImages } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', generalLimiter, validate(listOffersSchema), offerController.listOffers);
router.get('/:id', generalLimiter, validate(offerIdSchema), offerController.getOffer);

// Admin routes (API key required)
router.post('/', apiKeyAuth, adminLimiter, uploadImages.single('banner_image'), validate(createOfferSchema), offerController.createOffer);
router.put('/:id', apiKeyAuth, adminLimiter, uploadImages.single('banner_image'), validate(updateOfferSchema), offerController.updateOffer);
router.delete('/:id', apiKeyAuth, adminLimiter, validate(offerIdSchema), offerController.deleteOffer);

export default router;
