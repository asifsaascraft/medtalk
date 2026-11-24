import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import UserSession from "../models/UserSession.js";
import Speciality from "../models/Speciality.js";

import deleteS3Object from "../utils/deleteS3Object.js";
import asyncHandler from "../utils/asyncHandler.js";

import { successResponse, errorResponse } from "../utils/response.js";

import generateOtp from "../utils/generateOtp.js";
import generateTokens from "../utils/generateTokens.js";
import getDeviceInfo from "../utils/getDeviceInfo.js";
import hashOtp from "../utils/hashOtp.js";
import hashToken from "../utils/hashToken.js";
import verifyOtp from "../utils/verifyOtp.js";

import sendEmail from "../utils/sendEmail.js";
import sendOtpSMS from "../utils/sendOtpSMS.js";

import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookies.js";

//==================================================
// Constants
//==================================================

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5);

const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.OTP_RESEND_COOLDOWN_SECONDS || 60,
);

const OTP_LOCK_MINUTES = 15;

const PASSWORD_RESET_MINUTES = Number(
  process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15,
);

//==================================================
// Helper: Validate Email
//==================================================

const isValidEmail = (email) => {
  return (
    typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
};

//==================================================
// Helper: Validate Password
//==================================================

const isValidPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
};

//==================================================
// Helper: Compare Secrets Safely
//==================================================

const compareSecrets = (provided, actual) => {
  if (
    typeof provided !== "string" ||
    typeof actual !== "string" ||
    !provided ||
    !actual
  ) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const actualBuffer = Buffer.from(actual);

  if (providedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, actualBuffer);
};

//==================================================
// Helper: Revoke Existing Active Session
//==================================================

const revokeExistingSession = async (userId) => {
  const now = new Date();

  await UserSession.updateMany(
    {
      user: userId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        loggedOutAt: now,
        revokedAt: now,
        revokeReason: "new_login",
      },
    },
  );
};

//==================================================
// Helper: Create Login Session
//==================================================

const createLoginSession = async (user, req, res) => {
  // Revoke previous device/session first.
  await revokeExistingSession(user._id);

  // Create new tokens and session.
  const deviceInfo = getDeviceInfo(req);

  const tokens = await generateTokens({
    user,
    req,
    deviceInfo,
  });

  // Refresh token is stored in an HTTP-only cookie.
  setRefreshTokenCookie(res, tokens.refreshToken);

  return {
    accessToken: tokens.accessToken,
    session: tokens.session,
  };
};

//==================================================
// Helper: Handle Duplicate Database Errors
//==================================================

const isDuplicateKeyError = (error) => {
  return error?.code === 11000;
};

//==================================================
// 1. ADMIN SETUP
// POST /api/auth/admin/setup
//==================================================

export const setupAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, affiliation, specialityId, password } =
    req.body;

  // Validate setup secret.
  const providedSecret = req.headers["x-admin-setup-secret"];

  if (!compareSecrets(providedSecret, process.env.ADMIN_SETUP_SECRET)) {
    return errorResponse(res, {
      statusCode: 403,
      message: "Invalid admin setup authorization.",
    });
  }

  // Validate fields.
  if (
    !fullName?.trim() ||
    !email?.trim() ||
    !affiliation?.trim() ||
    !specialityId ||
    !password
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "All required fields must be provided.",
    });
  }

  if (!isValidEmail(email)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid email address.",
    });
  }

  if (!isValidPassword(password)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Password must contain 8 to 128 characters.",
    });
  }

  // Validate speciality ID.
  if (!/^[a-f\d]{24}$/i.test(specialityId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  const specialityExists = await Speciality.exists({
    _id: specialityId,
  });

  if (!specialityExists) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  // Only one admin is allowed.
  const existingAdmin = await User.exists({
    role: "admin",
  });

  if (existingAdmin) {
    return errorResponse(res, {
      statusCode: 409,
      message: "Admin account has already been created.",
    });
  }

  try {
    const admin = await User.create({
      fullName,
      email,
      mobile,
      affiliation,
      specialityId,
      password,
      role: "admin",
      status: "active",
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Admin account created successfully.",
      data: {
        user: admin,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorResponse(res, {
        statusCode: 409,
        message:
          "An admin account or account with these contact details already exists.",
      });
    }

    throw error;
  }
});

//==================================================
// 2. ADMIN LOGIN
// POST /api/auth/admin/login
//==================================================

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Email and password are required.",
    });
  }

  if (!isValidEmail(email)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid email address.",
    });
  }

  const admin = await User.findOne({
    email: email.trim().toLowerCase(),
    role: "admin",
  }).select("+password");

  if (!admin) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid email or password.",
    });
  }

  // Check account lock.
  if (admin.lockUntil && admin.lockUntil > new Date()) {
    return errorResponse(res, {
      statusCode: 423,
      message: "Account temporarily locked. Please try again later.",
    });
  }

  // Verify password.
  const isPasswordCorrect = await admin.matchPassword(password);

  if (!isPasswordCorrect) {
    await admin.incrementLoginAttempts();

    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid email or password.",
    });
  }

  // Update login information.
  await admin.updateLoginInfo();

  try {
    const { accessToken } = await createLoginSession(admin, req, res);

    return successResponse(res, {
      message: "Admin login successful.",
      data: {
        accessToken,
        user: admin,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorResponse(res, {
        statusCode: 409,
        message: "A login is already being processed. Please retry.",
      });
    }

    throw error;
  }
});

//==================================================
// 3. USER REGISTRATION
// POST /api/auth/user/register
//==================================================

export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, affiliation, specialityId } = req.body;

  if (
    !fullName?.trim() ||
    !email?.trim() ||
    !affiliation?.trim() ||
    !specialityId
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "All registration fields are required.",
    });
  }

  if (!isValidEmail(email)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid email address.",
    });
  }

  if (!/^[a-f\d]{24}$/i.test(specialityId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  const specialityExists = await Speciality.exists({
    _id: specialityId,
  });

  if (!specialityExists) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  const duplicateConditions = [
    {
      email: email.trim().toLowerCase(),
    },
  ];

  if (mobile?.trim()) {
    duplicateConditions.push({
      mobile: mobile.trim(),
    });
  }

  const existingUser = await User.findOne({
    $or: duplicateConditions,
  });

  if (existingUser) {
    return errorResponse(res, {
      statusCode: 409,
      message: "Email or mobile number is already registered.",
    });
  }

  try {
    const user = await User.create({
      fullName,
      email,
      mobile,
      affiliation,
      specialityId,
      role: "user",
      status: "active",
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Registration successful. You can now login using OTP.",
      data: {
        user,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorResponse(res, {
        statusCode: 409,
        message: "Email or mobile number is already registered.",
      });
    }

    throw error;
  }
});

//==================================================
// Helper: Send User Login OTP
//==================================================

const sendUserLoginOtp = async ({ identifier, channel, req, res }) => {
  if (!identifier || typeof identifier !== "string") {
    return errorResponse(res, {
      statusCode: 400,
      message: "Email or mobile number is required.",
    });
  }

  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (channel === "email" && !isValidEmail(normalizedIdentifier)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid email address.",
    });
  }

  if (channel === "mobile" && !/^[6-9]\d{9}$/.test(identifier.trim())) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid 10-digit mobile number.",
    });
  }

  const query =
    channel === "email"
      ? { email: normalizedIdentifier, role: "user" }
      : { mobile: identifier.trim(), role: "user" };

  const user = await User.findOne(query);

  // Generic response helps avoid exposing registered accounts.
  if (!user || user.status !== "active") {
    return successResponse(res, {
      message: `If an active account exists, an OTP will be sent to the registered ${channel}.`,
    });
  }

  // Check OTP lock.
  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    return errorResponse(res, {
      statusCode: 429,
      message: "Too many incorrect OTP attempts. Please try later.",
    });
  }

  // Check resend cooldown.
  if (user.otpLastSentAt) {
    const elapsedSeconds = (Date.now() - user.otpLastSentAt.getTime()) / 1000;

    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const remainingSeconds = Math.ceil(
        OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds,
      );

      return errorResponse(res, {
        statusCode: 429,
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
      });
    }
  }

  const otp = generateOtp();

  // Send OTP using the selected channel.
  if (channel === "email") {
    await sendEmail({
      to: user.email,
      name: user.fullName,
      subject: "Your MedTalk Login OTP",
      templateKey: process.env.ZEPTO_OTP_TEMPLATE_KEY,
      mergeInfo: {
        fullName: user.fullName,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
      },
    });
  } else {
    await sendOtpSMS(user.mobile, otp);
  }

  // Save OTP only after the provider accepts the request.
  user.otpHash = hashOtp(otp);

  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  user.otpLockedUntil = null;
  user.otpChannel = channel;

  await user.save();

  return successResponse(res, {
    message: `Login OTP sent successfully to your registered ${channel}.`,
  });
};

//==================================================
// 4. SEND MOBILE OTP
// POST /api/auth/user/login/mobile/send-otp
//==================================================

export const sendMobileOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  return sendUserLoginOtp({
    identifier: mobile,
    channel: "mobile",
    req,
    res,
  });
});

//==================================================
// 5. SEND EMAIL OTP
// POST /api/auth/user/login/email/send-otp
//==================================================

export const sendEmailOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  return sendUserLoginOtp({
    identifier: email,
    channel: "email",
    req,
    res,
  });
});

//==================================================
// Helper: Verify User OTP
//==================================================

const verifyUserLoginOtp = async ({ identifier, otp, channel, req, res }) => {
  if (!identifier || !otp) {
    return errorResponse(res, {
      statusCode: 400,
      message: `${channel === "email" ? "Email" : "Mobile number"} and OTP are required.`,
    });
  }

  if (!/^\d{6}$/.test(String(otp))) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid 6-digit OTP.",
    });
  }

  const normalizedIdentifier = identifier.trim().toLowerCase();

  const query =
    channel === "email"
      ? { email: normalizedIdentifier, role: "user" }
      : { mobile: identifier.trim(), role: "user" };

  const user = await User.findOne(query).select("+otpHash");

  if (!user || user.status !== "active") {
    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid OTP or account.",
    });
  }

  if (user.otpChannel !== channel || !user.otpHash) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please request a new OTP.",
    });
  }

  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    return errorResponse(res, {
      statusCode: 429,
      message: "Too many incorrect OTP attempts. Please try later.",
    });
  }

  if (!user.otpExpiresAt || user.otpExpiresAt <= new Date()) {
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.otpChannel = null;

    await user.save();

    return errorResponse(res, {
      statusCode: 400,
      message: "OTP has expired. Please request a new OTP.",
    });
  }

  const submittedHash = hashOtp(otp);

  const isValid = verifyOtp(submittedHash, user.otpHash);

  if (!isValid) {
    user.otpAttempts += 1;

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      user.otpLockedUntil = new Date(Date.now() + OTP_LOCK_MINUTES * 60 * 1000);

      user.otpHash = null;
      user.otpExpiresAt = null;
      user.otpChannel = null;
    }

    await user.save();

    return errorResponse(res, {
      statusCode: 401,
      message:
        user.otpAttempts >= OTP_MAX_ATTEMPTS
          ? "Maximum OTP attempts reached. Please try again later."
          : "Invalid OTP.",
    });
  }

  // OTP verified. Clear one-time credentials.
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.otpLastSentAt = null;
  user.otpLockedUntil = null;
  user.otpChannel = null;

  user.lastLoginAt = new Date();
  user.loginCount += 1;

  await user.save();

  try {
    const { accessToken } = await createLoginSession(user, req, res);

    return successResponse(res, {
      message: "Login successful.",
      data: {
        accessToken,
        user,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorResponse(res, {
        statusCode: 409,
        message: "A login is already being processed. Please retry.",
      });
    }

    throw error;
  }
};

//==================================================
// 6. VERIFY MOBILE OTP
// POST /api/auth/user/login/mobile/verify-otp
//==================================================

export const verifyMobileOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  return verifyUserLoginOtp({
    identifier: mobile,
    otp,
    channel: "mobile",
    req,
    res,
  });
});

//==================================================
// 7. VERIFY EMAIL OTP
// POST /api/auth/user/login/email/verify-otp
//==================================================

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  return verifyUserLoginOtp({
    identifier: email,
    otp,
    channel: "email",
    req,
    res,
  });
});

//==================================================
// 8. REFRESH TOKEN
// POST /api/auth/refresh-token
//==================================================

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Refresh token is required. Please login again.",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    clearRefreshTokenCookie(res);

    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid or expired refresh token. Please login again.",
    });
  }

  if (!decoded.id || !decoded.sessionId) {
    clearRefreshTokenCookie(res);

    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid refresh token.",
    });
  }

  const session = await UserSession.findOne({
    user: decoded.id,
    sessionId: decoded.sessionId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash");

  if (
    !session ||
    !session.refreshTokenHash ||
    session.refreshTokenHash !== hashToken(refreshToken)
  ) {
    clearRefreshTokenCookie(res);

    return errorResponse(res, {
      statusCode: 401,
      message: "Session expired or revoked. Please login again.",
    });
  }

  const user = await User.findById(decoded.id);

  if (!user || user.status !== "active") {
    clearRefreshTokenCookie(res);

    return errorResponse(res, {
      statusCode: 401,
      message: "Account is unavailable. Please login again.",
    });
  }

  // Rotate refresh token but preserve the same session ID.
  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
      sessionId: session.sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "15m",
    },
  );

  const newRefreshToken = jwt.sign(
    {
      id: user._id,
      sessionId: session.sessionId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
    },
  );

  const decodedRefresh = jwt.decode(newRefreshToken);

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.expiresAt = new Date(decodedRefresh.exp * 1000);
  session.lastActivityAt = new Date();

  await session.save();

  setRefreshTokenCookie(res, newRefreshToken);

  return successResponse(res, {
    message: "Access token refreshed successfully.",
    data: {
      accessToken,
    },
  });
});

//==================================================
// 9. LOGOUT
// POST /api/auth/logout
//==================================================

export const logout = asyncHandler(async (req, res) => {
  if (req.session) {
    await req.session.revoke("logout");
  }

  clearRefreshTokenCookie(res);

  return successResponse(res, {
    message: "Logged out successfully.",
  });
});

//==================================================
// 10. LOGOUT ALL DEVICES
// POST /api/auth/logout-all
//==================================================

export const logoutAll = asyncHandler(async (req, res) => {
  const now = new Date();

  await UserSession.updateMany(
    {
      user: req.user._id,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        loggedOutAt: now,
        revokedAt: now,
        revokeReason: "logout_all",
      },
    },
  );

  clearRefreshTokenCookie(res);

  return successResponse(res, {
    message: "Logged out from all devices successfully.",
  });
});

//==================================================
// 11. GET CURRENT USER
// GET /api/auth/me
//==================================================

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: "User profile fetched successfully.",
    data: {
      user: req.user,
      session: req.session,
    },
  });
});

//==================================================
// 12. ADMIN FORGOT PASSWORD
// POST /api/auth/admin/forgot-password
//==================================================

export const adminForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim() || !isValidEmail(email)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please enter a valid email address.",
    });
  }

  const admin = await User.findOne({
    email: email.trim().toLowerCase(),
    role: "admin",
  });

  // Generic response prevents account enumeration.
  if (!admin) {
    return successResponse(res, {
      message:
        "If an admin account exists, password reset instructions will be sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  admin.passwordResetToken = hashToken(resetToken);

  admin.passwordResetExpires = new Date(
    Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000,
  );

  await admin.save();

  const frontendUrl = process.env.ADMIN_FRONTEND_URL;

  if (!frontendUrl || !process.env.ZEPTO_PASSWORD_RESET_TEMPLATE_KEY) {
    throw new Error("Admin password reset email configuration is missing.");
  }

  const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: admin.email,
      name: admin.fullName,
      subject: "MedTalk Admin Password Reset",
      templateKey: process.env.ZEPTO_PASSWORD_RESET_TEMPLATE_KEY,
      mergeInfo: {
        fullName: admin.fullName,
        resetUrl,
        expiryMinutes: PASSWORD_RESET_MINUTES,
      },
    });
  } catch (error) {
    // Invalidate token if email delivery fails.
    admin.passwordResetToken = null;
    admin.passwordResetExpires = null;

    await admin.save();

    throw error;
  }

  return successResponse(res, {
    message:
      "If an admin account exists, password reset instructions will be sent.",
  });
});

//==================================================
// 13. ADMIN RESET PASSWORD
// POST /api/auth/admin/reset-password/:token
//==================================================

export const adminResetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Password reset token is required.",
    });
  }

  if (!isValidPassword(password)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Password must contain 8 to 128 characters.",
    });
  }

  if (password !== confirmPassword) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Password and confirm password do not match.",
    });
  }

  const admin = await User.findOne({
    role: "admin",
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken");

  if (!admin) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid or expired password reset token.",
    });
  }

  admin.password = password;
  admin.passwordResetToken = null;
  admin.passwordResetExpires = null;

  // The User pre-save hook hashes the new password.
  await admin.save();

  // Revoke every existing login session.
  const now = new Date();

  await UserSession.updateMany(
    {
      user: admin._id,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        loggedOutAt: now,
        revokedAt: now,
        revokeReason: "password_changed",
      },
    },
  );

  clearRefreshTokenCookie(res);

  return successResponse(res, {
    message: "Admin password reset successfully. Please login again.",
  });
});

//==================================================
// 14. ADMIN CHANGE PASSWORD
// POST /api/auth/admin/change-password
//==================================================

export const adminChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return errorResponse(res, {
      statusCode: 400,
      message: "All password fields are required.",
    });
  }

  if (!isValidPassword(newPassword)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "New password must contain 8 to 128 characters.",
    });
  }

  if (newPassword !== confirmPassword) {
    return errorResponse(res, {
      statusCode: 400,
      message: "New password and confirm password do not match.",
    });
  }

  const admin = await User.findOne({
    _id: req.user._id,
    role: "admin",
  }).select("+password");

  if (!admin) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Admin account not found.",
    });
  }

  const isPasswordCorrect = await admin.matchPassword(currentPassword);

  if (!isPasswordCorrect) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Current password is incorrect.",
    });
  }

  if (currentPassword === newPassword) {
    return errorResponse(res, {
      statusCode: 400,
      message: "New password must be different from current password.",
    });
  }

  admin.password = newPassword;

  await admin.save();

  // Revoke all sessions after password change.
  const now = new Date();

  await UserSession.updateMany(
    {
      user: admin._id,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        loggedOutAt: now,
        revokedAt: now,
        revokeReason: "password_changed",
      },
    },
  );

  clearRefreshTokenCookie(res);

  return successResponse(res, {
    message: "Password changed successfully. Please login again.",
  });
});

//==================================================
// 15. UPDATE PROFILE IMAGE
// PUT /api/auth/profile-image
//==================================================

export const updateProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return errorResponse(res, {
      statusCode: 404,
      message: "User not found.",
    });
  }

  if (!req.profileImageUrl) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Profile image is required.",
    });
  }

  // Delete old image.
  if (user.profileImage) {
    await deleteS3Object(user.profileImage);
  }

  user.profileImage = req.profileImageUrl;

  await user.save();

  return successResponse(res, {
    message: "Profile image updated successfully.",
    data: {
      profileImage: user.profileImage,
    },
  });
});

//==================================================
// 16. DELETE PROFILE IMAGE
// DELETE /api/auth/profile-image
//==================================================

export const removeProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return errorResponse(res, {
      statusCode: 404,
      message: "User not found.",
    });
  }

  if (!user.profileImage) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Profile image does not exist.",
    });
  }

  await deleteS3Object(user.profileImage);

  user.profileImage = null;

  await user.save();

  return successResponse(res, {
    message: "Profile image deleted successfully.",
  });
});
