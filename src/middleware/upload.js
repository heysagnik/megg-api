import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/avi'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WebM videos are allowed.'), false);
  }
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  }
});

export const uploadImagesHandler = (req, res, next) => {
  const multerMiddleware = uploadImages.fields([
    { name: 'images', maxCount: 10 },
    { name: 'images[]', maxCount: 10 }
  ]);

  multerMiddleware(req, res, (err) => {
    if (err) return next(err);

    const normalizedFiles = [];

    if (Array.isArray(req.files)) {
      normalizedFiles.push(...req.files);
    } else if (req.files && typeof req.files === 'object') {
      if (req.files.images && Array.isArray(req.files.images)) {
        normalizedFiles.push(...req.files.images);
      }
      if (req.files['images[]'] && Array.isArray(req.files['images[]'])) {
        normalizedFiles.push(...req.files['images[]']);
      }
    }

    req.files = normalizedFiles;
    next();
  });
};

export const uploadModelImageHandler = (req, res, next) => {
  const multerMiddleware = uploadImages.fields([
    { name: 'model_image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'images[]', maxCount: 10 }
  ]);

  multerMiddleware(req, res, (err) => {
    if (err) return next(err);

    const normalizedFiles = [];

    if (Array.isArray(req.files)) {
      normalizedFiles.push(...req.files);
    } else if (req.files && typeof req.files === 'object') {
      if (req.files.model_image && Array.isArray(req.files.model_image)) {
        normalizedFiles.push(...req.files.model_image);
      }
      if (req.files.images && Array.isArray(req.files.images)) {
        normalizedFiles.push(...req.files.images);
      }
      if (req.files['images[]'] && Array.isArray(req.files['images[]'])) {
        normalizedFiles.push(...req.files['images[]']);
      }
    }

    req.files = normalizedFiles;
    next();
  });
};

export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1
  }
});

export const uploadVideoHandler = (req, res, next) => {
  const multerMiddleware = uploadVideo.single('video');

  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new Error('File too large. Maximum size is 100MB.'));
        }
      }
      return next(err);
    }
    next();
  });
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

export const uploadBannerHandler = (req, res, next) => {
  const multerMiddleware = uploadSingleImage.single('banner_image');

  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new Error('File too large. Maximum size is 5MB.'));
        }
      }
      return next(err);
    }
    next();
  });
};

export const normalizeProductUpdateData = (req, res, next) => {
  if (req.body) {
    // Handle images[] -> images
    if (req.body['images[]']) {
      const imgs = req.body['images[]'];
      req.body.images = Array.isArray(imgs) ? imgs : [imgs];
      delete req.body['images[]'];
    } else if (req.body.images && !Array.isArray(req.body.images)) {
      req.body.images = [req.body.images];
    }

    // Handle price coercion
    if (req.body.price) {
      req.body.price = parseFloat(req.body.price);
    }

    // Handle fabric parsing
    if (req.body.fabric && typeof req.body.fabric === 'string') {
      try {
        req.body.fabric = JSON.parse(req.body.fabric);
      } catch (e) {
        // ignore
      }
    }
  }
  next();
};

