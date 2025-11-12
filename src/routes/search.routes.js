import express from 'express';
import * as searchController from '../controllers/search.controller.js';
import { validate } from '../middleware/validate.js';
import {
  unifiedSearchSchema,
  smartSearchSchema,
  advancedSearchSchema,
  searchSuggestionsSchema
} from '../validators/search.validators.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', generalLimiter, validate(unifiedSearchSchema), searchController.unifiedSearch);
router.get('/smart', generalLimiter, validate(smartSearchSchema), searchController.smartSearch);
router.get('/advanced', generalLimiter, validate(advancedSearchSchema), searchController.advancedSearch);
router.get('/suggestions', generalLimiter, validate(searchSuggestionsSchema), searchController.getSearchSuggestions);

export default router;
