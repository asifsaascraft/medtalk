import express from "express";
import rateLimit from "express-rate-limit";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import uploadProfileImage from "../middlewares/uploadProfileImage.js";

import {
  setupAdmin,
  adminLogin,
  adminForgotPassword,
  adminResetPassword,
  adminChangePassword,

  registerUser,
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,

  refreshAccessToken,
  logout,
  logoutAll,
  getMe,
  updateProfileImage,
  removeProfileImage,
} from "../controllers/authController.js";

const router = express.Router();

//==================================================
// Rate Limiters
//==================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

//==================================================
// Admin Authentication
//==================================================

// One-time setup using Postman and x-admin-setup-secret.
router.post(
  "/admin/setup",
  authLimiter,
  setupAdmin,
);

// Admin email/password login.
router.post(
  "/admin/login",
  authLimiter,
  adminLogin,
);

// Forgot password.
router.post(
  "/admin/forgot-password",
  authLimiter,
  adminForgotPassword,
);

// Reset password using email token.
router.post(
  "/admin/reset-password/:token",
  authLimiter,
  adminResetPassword,
);

// Change password (admin only).
router.post(
  "/admin/change-password",
  protect,
  authorize("admin"),
  adminChangePassword,
);

//==================================================
// User Authentication
//==================================================

// Public user registration.
router.post(
  "/user/register",
  authLimiter,
  registerUser,
);

// Send OTP to mobile.
router.post(
  "/user/login/mobile/send-otp",
  otpLimiter,
  sendMobileOtp,
);

// Verify mobile OTP.
router.post(
  "/user/login/mobile/verify-otp",
  authLimiter,
  verifyMobileOtp,
);

// Send OTP to email.
router.post(
  "/user/login/email/send-otp",
  otpLimiter,
  sendEmailOtp,
);

// Verify email OTP.
router.post(
  "/user/login/email/verify-otp",
  authLimiter,
  verifyEmailOtp,
);

//==================================================
// Shared Session APIs
//==================================================

// Refresh access token using HTTP-only refresh cookie.
router.post(
  "/refresh-token",
  authLimiter,
  refreshAccessToken,
);

// Logout current session.
router.post(
  "/logout",
  protect,
  logout,
);

// Logout all devices.
router.post(
  "/logout-all",
  protect,
  logoutAll,
);

// Get current authenticated user.
router.get(
  "/me",
  protect,
  getMe,
);

// Upload / Replace Profile Image

router.put(
  "/profile-image",
  protect,
  uploadProfileImage,
  updateProfileImage,
);

// Remove Profile Image

router.delete(
  "/profile-image",
  protect,
  removeProfileImage,
);


export default router;



