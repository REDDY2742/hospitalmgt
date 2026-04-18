const authService = require('./auth.service');
const Response = require('../../utils/response.util');

/**
 * Authentication Controller
 * 
 * Thin layer handling HTTP ingress/egress for the identity module.
 * Delegates all business logic to AuthService.
 */

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    Response.created(res, 'User registered successfully', { user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken, permissions } = await authService.login(email, password);

    // Set Refresh Token in httpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    Response.success(res, 'Login successful', {
      accessToken,
      user,
      permissions
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { refreshToken } = req.cookies;

    await authService.logout(token, refreshToken);

    res.clearCookie('refreshToken');
    Response.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshToken(token);

    Response.success(res, 'Token refreshed successfully', { accessToken });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    Response.success(res, 'OTP sent to registered email');
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyOTP(email, otp);
    Response.success(res, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    Response.success(res, 'Password reset successful. All active sessions invalidated.');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    Response.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is populated by auth.middleware.js
    Response.success(res, 'Profile retrieved', { 
      user: req.user,
      permissions: req.user.permissions || [] 
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    Response.success(res, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  getMe,
  updateProfile
};
