import * as productService from '../services/product.service.js';
import * as uploadService from '../services/upload.service.js';
import * as searchService from '../services/search.service.js';
import cache from '../utils/cache.js';

export const uploadProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      });
    }

    const imageUrls = await uploadService.uploadMultipleProductImages(req.files);

    res.status(201).json({
      success: true,
      data: {
        images: imageUrls
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const cacheKey = `products:${req.originalUrl}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        source: 'cache'
      });
    }

    let result;
    if (req.query.search) {
      // Use unified search service for smart search capabilities
      result = await searchService.unifiedSearch({
        ...req.query,
        query: req.query.search // Map 'search' param to 'query'
      });
    } else {
      result = await productService.listProducts(req.query);
    }

    cache.set(cacheKey, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const browseByCategory = async (req, res, next) => {
  try {
    const cacheKey = `category:${req.originalUrl}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        source: 'cache'
      });
    }

    const result = await productService.browseByCategory({
      category: req.params.category,
      ...req.query
    });

    cache.set(cacheKey, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const result = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const products = await productService.getRelatedProducts(req.params.id);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    let productData = { ...req.body };

    if (productData.price) {
      productData.price = parseFloat(productData.price);
    }

    if (productData.suggested_colors && typeof productData.suggested_colors === 'string') {
      productData.suggested_colors = JSON.parse(productData.suggested_colors);
    }

    if (req.files && req.files.length > 0) {
      const imageUrls = await uploadService.uploadMultipleProductImages(req.files);
      productData.images = imageUrls;
    }

    const product = await productService.createProduct(productData);

    // Invalidate cache on new product
    cache.flushAll();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    const files = req.files || [];

    const product = await productService.updateProduct(req.params.id, updates, files);

    // Invalidate cache on update
    cache.flushAll();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);

    // Invalidate cache on delete
    cache.flushAll();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const trackProductClick = async (req, res, next) => {
  try {
    await productService.incrementProductClicks(req.params.id);
    res.json({ success: true, message: 'Click tracked' });
  } catch (error) {
    next(error);
  }
};

