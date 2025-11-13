const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { sendFail } = require("../shared/res/formatResponse");

/**
 * Verify JWT access token from cookie or Authorization header
 * Attaches user info to req.user if valid
 */
const verifyAccessToken = (req, res, next) => {
  try {
    // Get token from cookie (priority) or Authorization header
    let token = req.cookies?.accessToken;

    // If not in cookie, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    // No token found
    if (!token) {
      return sendFail(
        res,
        "Access token is required. Please login.",
        StatusCodes.UNAUTHORIZED
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendFail(
        res,
        "Access token has expired. Please refresh your token.",
        StatusCodes.UNAUTHORIZED
      );
    }

    if (error.name === "JsonWebTokenError") {
      return sendFail(
        res,
        "Invalid access token. Please login again.",
        StatusCodes.UNAUTHORIZED
      );
    }

    return sendFail(res, "Authentication failed", StatusCodes.UNAUTHORIZED);
  }
};

/**
 * Check if user has required role
 * @param {...string} allowedRoles - List of allowed roles (e.g., 'admin', 'user')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
      return sendFail(res, "Authentication required", StatusCodes.UNAUTHORIZED);
    }

    // Check if user has one of the allowed roles
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return sendFail(
        res,
        `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        StatusCodes.FORBIDDEN
      );
    }

    next();
  };
};

module.exports = {
  verifyAccessToken,
  requireRole,
};
