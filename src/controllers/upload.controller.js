import * as uploadService from '../services/upload.service.js';

export const uploadReelVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const result = await uploadService.uploadReelVideo(
      req.file.buffer,
      req.file.originalname
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

    const url = await uploadService.uploadProductImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
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

