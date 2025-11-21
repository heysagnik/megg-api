import express from 'express';
import * as searchController from '../controllers/search.controller.js';
import { validate } from '../middleware/validate.js';
import { publicCache } from '../middleware/cacheControl.js';
import {
  unifiedSearchSchema,
  smartSearchSchema,
  advancedSearchSchema,
  searchSuggestionsSchema
} from '../validators/search.validators.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', generalLimiter, publicCache(60), validate(unifiedSearchSchema), searchController.unifiedSearch);
router.get('/smart', generalLimiter, publicCache(60), validate(smartSearchSchema), searchController.smartSearch);
router.get('/advanced', generalLimiter, publicCache(60), validate(advancedSearchSchema), searchController.advancedSearch);
router.get('/suggestions', generalLimiter, publicCache(300), validate(searchSuggestionsSchema), searchController.getSearchSuggestions);

export default router;
