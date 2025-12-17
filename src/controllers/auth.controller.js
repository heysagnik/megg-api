import * as authService from '../services/auth.service.js';

export const mobileGoogleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const { user, session } = await authService.exchangeGoogleIdToken(
      idToken,
      req.headers['user-agent'],
      req.ip || req.socket?.remoteAddress
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.image
        },
        session: {
          token: session.token,
          expiresAt: session.expiresAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await authService.updateUserProfile(req.user.id, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) await authService.logout(token);
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

export const checkSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = await authService.validateSession(token);

    if (!session) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        avatar_url: session.image
      }
    });
  } catch (error) {
    next(error);
  }
};
