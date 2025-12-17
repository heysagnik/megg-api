import * as productService from '../services/product.service.js';
import * as uploadService from '../services/upload.service.js';
import * as searchService from '../services/search.service.js';

const parseJsonField = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (value === '') return undefined;
  if (value.trim().startsWith('[') || value.trim().startsWith('{')) {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

export const uploadProductImages = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, error: 'No images provided' });
    }
    const images = await uploadService.uploadMultipleProductImages(req.files);
    res.status(201).json({ success: true, data: { images } });
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const result = req.query.search
      ? await searchService.unifiedSearch({ ...req.query, query: req.query.search })
      : await productService.listProducts(req.query);

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const browseByCategory = async (req, res, next) => {
  try {
    const result = await productService.browseByCategory({
      category: req.params.category,
      ...req.query
    });
    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const result = await productService.getProductById(req.params.id);
    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const products = await productService.getRelatedProducts(req.params.id);
    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    if (productData.price) productData.price = parseFloat(productData.price);
    productData.fabric = parseJsonField(productData.fabric);

    if (req.files?.length) {
      productData.images = await uploadService.uploadMultipleProductImages(req.files);
    }

    const product = await productService.createProduct(productData);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.fabric === '' || updates.fabric === null) delete updates.fabric;
    else updates.fabric = parseJsonField(updates.fabric);

    if (updates.semantic_tags === '' || updates.semantic_tags === null) delete updates.semantic_tags;
    else updates.semantic_tags = parseJsonField(updates.semantic_tags);

    const product = await productService.updateProduct(req.params.id, updates, req.files || []);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const trackProductClick = async (req, res, next) => {
  try {
    await productService.incrementProductClicks(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getColorVariants = async (req, res, next) => {
  try {
    const variants = await productService.getColorVariants(req.params.id);
    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedFromSubcategory = async (req, res, next) => {
  try {
    const products = await productService.getRecommendedFromSubcategory(req.params.id);
    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
