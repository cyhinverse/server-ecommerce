const catchAsync = require("../configs/catchAsync");
const discountService = require("../services/discount.service");
const { StatusCodes } = require("http-status-codes");
const { sendSuccess, sendFail } = require("../shared/res/formatResponse");
const {
  createDiscountValidator,
  updateDiscountValidator,
  applyDiscountValidator,
  discountIdParamValidator,
  discountCodeParamValidator,
  getDiscountsQueryValidator,
} = require("../validations/discount.validator");

const DiscountController = {
  // Create discount (Admin only)
  createDiscount: catchAsync(async (req, res) => {
    // Validate request body
    const { error, value } = createDiscountValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const discount = await discountService.createDiscount(value);

    return sendSuccess(
      res,
      discount,
      "Discount created successfully",
      StatusCodes.CREATED
    );
  }),

  // Get all discounts (Admin only)
  getAllDiscounts: catchAsync(async (req, res) => {
    // Validate query params
    const { error, value } = getDiscountsQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await discountService.getAllDiscounts(value);

    return sendSuccess(
      res,
      result,
      "Discounts retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get active discounts (Public/User)
  getActiveDiscounts: catchAsync(async (req, res) => {
    // Validate query params
    const { error, value } = getDiscountsQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await discountService.getActiveDiscounts(value);

    return sendSuccess(
      res,
      result,
      "Active discounts retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get discount by ID
  getDiscountById: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = discountIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const discount = await discountService.getDiscountById(value.discountId);

    return sendSuccess(
      res,
      discount,
      "Discount retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get discount by code
  getDiscountByCode: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = discountCodeParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const discount = await discountService.getDiscountByCode(value.code);

    return sendSuccess(
      res,
      discount,
      "Discount retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Update discount (Admin only)
  updateDiscount: catchAsync(async (req, res) => {
    // Validate params
    const paramError = discountIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (paramError.error) {
      const errors = paramError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate body
    const bodyError = updateDiscountValidator.validate(req.body, {
      abortEarly: false,
    });

    if (bodyError.error) {
      const errors = bodyError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { discountId } = paramError.value;
    const discount = await discountService.updateDiscount(
      discountId,
      bodyError.value
    );

    return sendSuccess(
      res,
      discount,
      "Discount updated successfully",
      StatusCodes.OK
    );
  }),

  // Delete discount (Admin only)
  deleteDiscount: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = discountIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await discountService.deleteDiscount(value.discountId);

    return sendSuccess(res, result, result.message, StatusCodes.OK);
  }),

  // Apply discount code (validate)
  applyDiscount: catchAsync(async (req, res) => {
    // Validate request body
    const { error, value } = applyDiscountValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await discountService.applyDiscount(
      value.code,
      value.orderTotal,
      value.productIds
    );

    return sendSuccess(
      res,
      result,
      "Discount applied successfully",
      StatusCodes.OK
    );
  }),

  // Get discount statistics (Admin only)
  getDiscountStatistics: catchAsync(async (req, res) => {
    const stats = await discountService.getDiscountStatistics();

    return sendSuccess(
      res,
      stats,
      "Discount statistics retrieved successfully",
      StatusCodes.OK
    );
  }),
};

module.exports = DiscountController;
