import * as productService from '../services/product.service.js';
import * as uploadService from '../services/upload.service.js';

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
    const result = await productService.listProducts(req.query);

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
    const result = await productService.browseByCategory({
      category: req.params.category,
      ...req.query
    });

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
    const product = await productService.updateProduct(req.params.id, req.body);

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

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

