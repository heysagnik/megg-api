import express from 'express';
import * as offerController from '../controllers/offer.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { publicCache } from '../middleware/cacheControl.js';
import {
  listOffersSchema,
  createOfferSchema,
  updateOfferSchema,
  offerIdSchema
} from '../validators/offer.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { uploadImages } from '../middleware/upload.js';

const router = express.Router();

router.get('/', generalLimiter, publicCache(300), validate(listOffersSchema), offerController.listOffers);
router.get('/:id', generalLimiter, publicCache(300), validate(offerIdSchema), offerController.getOffer);

router.post('/', authenticate, requireAdmin, adminLimiter, uploadImages.single('banner_image'), validate(createOfferSchema), offerController.createOffer);
router.put('/:id', authenticate, requireAdmin, adminLimiter, uploadImages.single('banner_image'), validate(updateOfferSchema), offerController.updateOffer);
router.delete('/:id', authenticate, requireAdmin, adminLimiter, validate(offerIdSchema), offerController.deleteOffer);

export default router;

