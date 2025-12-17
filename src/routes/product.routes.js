import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import {
  listProductsSchema,
  browseCategorySchema,
  createProductSchema,
  createProductWithFilesSchema,
  updateProductSchema,
  productIdSchema
} from '../validators/product.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { uploadImages, uploadImagesHandler, normalizeProductUpdateData } from '../middleware/upload.js';
import { sequentialWrite } from '../middleware/queue.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/', generalLimiter, validate(listProductsSchema), productController.listProducts);
router.get('/browse/:category', generalLimiter, validate(browseCategorySchema), productController.browseByCategory);
router.get('/:id', generalLimiter, validate(productIdSchema), productController.getProduct);
router.post('/:id/click', generalLimiter, validate(productIdSchema), productController.trackProductClick);
router.get('/:id/related', generalLimiter, validate(productIdSchema), productController.getRelatedProducts);
router.get('/:id/variants', generalLimiter, validate(productIdSchema), productController.getColorVariants);
router.get('/:id/recommendations', generalLimiter, validate(productIdSchema), productController.getRecommendedFromSubcategory);

// Admin routes (API key required)
router.post('/upload-images', apiKeyAuth, adminLimiter, uploadImagesHandler, productController.uploadProductImages);
router.post('/', apiKeyAuth, adminLimiter, sequentialWrite, uploadImagesHandler, validate(createProductWithFilesSchema), productController.createProduct);
router.put('/:id', apiKeyAuth, adminLimiter, sequentialWrite, uploadImagesHandler, normalizeProductUpdateData, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', apiKeyAuth, adminLimiter, sequentialWrite, validate(productIdSchema), productController.deleteProduct);

export default router;
