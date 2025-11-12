import * as authService from '../services/auth.service.js';

export const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await authService.exchangeGoogleToken(token);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await authService.updateUserProfile(req.user.id, req.body);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const checkAdminStatus = async (req, res, next) => {
  try {
    const isAdmin = await authService.checkAdminStatus(req.user.id);
    const profile = await authService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: {
        isAdmin,
        user: {
          id: req.user.id,
          email: req.user.email,
          ...profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

