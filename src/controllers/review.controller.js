const catchAsync = require("../configs/catchAsync");
const reviewService = require("../services/review.service");
const { StatusCodes } = require("http-status-codes");
const { sendSuccess, sendFail } = require("../shared/res/formatResponse");
const {
  createReviewValidator,
  updateReviewValidator,
  reviewIdParamValidator,
  productIdParamValidator,
  getReviewsQueryValidator,
} = require("../validations/review.validator");

const ReviewController = {
  // Create review (User only - must have purchased product)
  createReview: catchAsync(async (req, res) => {
    // Validate request body
    const { error, value } = createReviewValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const review = await reviewService.createReview(userId, value);

    return sendSuccess(
      res,
      review,
      "Review created successfully",
      StatusCodes.CREATED
    );
  }),

  // Get all reviews for a product (Public)
  getProductReviews: catchAsync(async (req, res) => {
    // Validate params
    const paramError = productIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (paramError.error) {
      const errors = paramError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate query
    const queryError = getReviewsQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (queryError.error) {
      const errors = queryError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { productId } = paramError.value;
    const result = await reviewService.getProductReviews(
      productId,
      queryError.value
    );

    return sendSuccess(
      res,
      result,
      "Product reviews retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get user's reviews (User only)
  getUserReviews: catchAsync(async (req, res) => {
    // Validate query
    const { error, value } = getReviewsQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const result = await reviewService.getUserReviews(userId, value);

    return sendSuccess(
      res,
      result,
      "User reviews retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get single review by ID
  getReviewById: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = reviewIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const review = await reviewService.getReviewById(value.reviewId);

    return sendSuccess(
      res,
      review,
      "Review retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Update review (User only - own review)
  updateReview: catchAsync(async (req, res) => {
    // Validate params
    const paramError = reviewIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (paramError.error) {
      const errors = paramError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate body
    const bodyError = updateReviewValidator.validate(req.body, {
      abortEarly: false,
    });

    if (bodyError.error) {
      const errors = bodyError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const { reviewId } = paramError.value;
    const review = await reviewService.updateReview(
      reviewId,
      userId,
      bodyError.value
    );

    return sendSuccess(
      res,
      review,
      "Review updated successfully",
      StatusCodes.OK
    );
  }),

  // Delete review (User - own review, Admin - any review)
  deleteReview: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = reviewIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";
    const result = await reviewService.deleteReview(
      value.reviewId,
      userId,
      isAdmin
    );

    return sendSuccess(res, result, result.message, StatusCodes.OK);
  }),

  // Check if user can review product (User only)
  canUserReview: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = productIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const result = await reviewService.canUserReview(userId, value.productId);

    return sendSuccess(
      res,
      result,
      "Review eligibility checked",
      StatusCodes.OK
    );
  }),

  // Get review statistics (Admin only)
  getReviewStatistics: catchAsync(async (req, res) => {
    const stats = await reviewService.getReviewStatistics();

    return sendSuccess(
      res,
      stats,
      "Review statistics retrieved successfully",
      StatusCodes.OK
    );
  }),
};

module.exports = ReviewController;
