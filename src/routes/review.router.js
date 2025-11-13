const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/auth.middleware");

// Public routes (no authentication required)
router.get("/product/:productId", reviewController.getProductReviews);
router.get("/:reviewId", reviewController.getReviewById);

// User routes (require authentication)
router.post("/", verifyAccessToken, reviewController.createReview);
router.get("/user/me", verifyAccessToken, reviewController.getUserReviews);
router.get(
  "/check/:productId",
  verifyAccessToken,
  reviewController.canUserReview
);
router.put("/:reviewId", verifyAccessToken, reviewController.updateReview);
router.delete("/:reviewId", verifyAccessToken, reviewController.deleteReview);

// Admin routes (require admin role)
router.get(
  "/statistics/overview",
  verifyAccessToken,
  requireRole("admin"),
  reviewController.getReviewStatistics
);

module.exports = router;
