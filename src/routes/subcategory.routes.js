import { Router } from 'express';
import * as subcategoryController from '../controllers/subcategory.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSubcategorySchema, updateSubcategorySchema } from '../validators/subcategory.validators.js';

const router = Router();

// Public routes
router.get('/', subcategoryController.listAll);
router.get('/:category', subcategoryController.listByCategory);

// Admin routes
router.post('/', authenticate, requireAdmin, validate(createSubcategorySchema), subcategoryController.create);
router.put('/:id', authenticate, requireAdmin, validate(updateSubcategorySchema), subcategoryController.update);
router.delete('/:id', authenticate, requireAdmin, subcategoryController.remove);

export default router;
