import * as uploadService from '../services/upload.service.js';
import crypto from 'crypto';

export const uploadReelVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file provided' });
    }

    // Use provided reelId or generate one
    const reelId = req.body.reelId || crypto.randomUUID();

    const result = await uploadService.uploadReelVideo(req.file, reelId);

    res.status(201).json({
      success: true,
      data: {
        ...result,
        reelId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Use provided productId or generate one
    const productId = req.body.productId || crypto.randomUUID();

    const result = await uploadService.uploadProductImage(req.file, productId);

    res.status(201).json({
      success: true,
      data: {
        ...result,
        productId
      }
    });
  } catch (error) {
    next(error);
  }
};
