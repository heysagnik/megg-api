import * as offerService from '../services/offer.service.js';
import * as uploadService from '../services/upload.service.js';
import { ValidationError } from '../utils/errors.js';

export const listOffers = async (req, res, next) => {
  try {
    const result = await offerService.listOffers(req.query);

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getOffer = async (req, res, next) => {
  try {
    const offer = await offerService.getOfferById(req.params.id);

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

export const createOffer = async (req, res, next) => {
  try {
    let offerData = { ...req.body };

    if (req.file) {
      const imgUrl = await uploadService.uploadOfferBanner(req.file.buffer, req.file.originalname, req.file.mimetype);
      offerData.banner_image = imgUrl;
    }

    if (!offerData.affiliate_link) {
      throw new ValidationError('affiliate_link is required');
    }

    if (!offerData.banner_image) {
      throw new ValidationError('banner_image is required (either upload file or provide URL)');
    }

    const offer = await offerService.createOffer(offerData);

    res.status(201).json({
      success: true,
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    let updates = { ...req.body };
    const existing = await offerService.getOfferById(req.params.id);

    if (req.file) {
      const imgUrl = await uploadService.uploadOfferBanner(req.file.buffer, req.file.originalname, req.file.mimetype);
      updates.banner_image = imgUrl;
    }

    const finalAffiliate = updates.affiliate_link || (existing && existing.affiliate_link);
    const finalBanner = updates.banner_image || (existing && existing.banner_image);

    if (!finalAffiliate) {
      throw new ValidationError('affiliate_link is required');
    }

    if (!finalBanner) {
      throw new ValidationError('banner_image is required (either upload file or provide URL)');
    }

    const offer = await offerService.updateOffer(req.params.id, updates);

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    await offerService.deleteOffer(req.params.id);

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

