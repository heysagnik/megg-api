import * as uploadService from '../services/upload.service.js';

export const uploadReelVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { reelId } = req.body;

    // Pass the file object (with buffer) directly as service expects file.buffer/file.size
    const result = await uploadService.uploadReelVideo(
      req.file,
      reelId
    );

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { productId } = req.body;
    // Service expects (file, productId, index). File object needs buffer.
    const url = await uploadService.uploadProductImage(
      req.file,
      productId || 'temp' // fallback if productId not mandatory but usually is
    );

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url }
    });
  } catch (error) {
    next(error);
  }
};

