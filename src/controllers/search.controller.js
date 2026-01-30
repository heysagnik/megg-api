import * as searchService from '../services/search.service.js';

export const unifiedSearch = async (req, res, next) => {
  try {
    const embedding = req.body?.embedding;
    const params = { ...req.query, embedding };

    const results = embedding && Array.isArray(embedding)
      ? await searchService.hybridSearch(params)
      : await searchService.unifiedSearch(params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const getFilters = async (req, res, next) => {
  try {
    const filters = await searchService.getAvailableFilters(req.query);

    res.json({
      success: true,
      data: filters
    });
  } catch (error) {
    next(error);
  }
};

export const smartSearch = async (req, res, next) => {
  try {
    const results = await searchService.smartSearch(req.query);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const advancedSearch = async (req, res, next) => {
  try {
    const results = await searchService.advancedSearch(req.query);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const getSearchSuggestions = async (req, res, next) => {
  try {
    const suggestions = await searchService.getSearchSuggestions(req.query.query);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};
