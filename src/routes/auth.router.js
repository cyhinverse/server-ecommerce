const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../middlewares/auth.middleware");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens in cookies
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/send-verification-code
 * @desc    Send verification code to email (new or resend)
 * @access  Public
 * @body    { email }
 */
router.post("/send-verification-code", authController.sendVerificationCode);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with 6-digit code
 * @access  Public
 * @body    { code }
 */
router.post("/verify-code", authController.verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset code
 * @access  Public
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with code
 * @access  Public
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token in cookie)
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookies
 * @access  Public
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private (requires authentication)
 */
router.post(
  "/change-password",
  verifyAccessToken,
  authController.changePassword
);

module.exports = router;
