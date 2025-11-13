const catchAsync = require("../configs/catchAsync");
const orderService = require("../services/order.service");
const { StatusCodes } = require("http-status-codes");
const { sendSuccess, sendFail } = require("../shared/res/formatResponse");
const {
  createOrderValidator,
  updateOrderStatusValidator,
  orderIdParamValidator,
  getOrdersQueryValidator,
} = require("../validations/order.validator");

const OrderController = {
  // Create order from cart
  createOrder: catchAsync(async (req, res) => {
    // Validate request body
    const { error, value } = createOrderValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const order = await orderService.createOrder(userId, value);

    return sendSuccess(
      res,
      order,
      "Order created successfully",
      StatusCodes.CREATED
    );
  }),

  // Get all orders (Admin only)
  getAllOrders: catchAsync(async (req, res) => {
    // Validate query params
    const { error, value } = getOrdersQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await orderService.getAllOrders(value);

    return sendSuccess(
      res,
      result,
      "Orders retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get user's orders
  getUserOrders: catchAsync(async (req, res) => {
    // Validate query params
    const { error, value } = getOrdersQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const result = await orderService.getUserOrders(userId, value);

    return sendSuccess(
      res,
      result,
      "Orders retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get single order by ID
  getOrderById: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = orderIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";
    const order = await orderService.getOrderById(
      value.orderId,
      userId,
      isAdmin
    );

    return sendSuccess(
      res,
      order,
      "Order retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Update order status (Admin only)
  updateOrderStatus: catchAsync(async (req, res) => {
    // Validate params
    const paramError = orderIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (paramError.error) {
      const errors = paramError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate body
    const bodyError = updateOrderStatusValidator.validate(req.body, {
      abortEarly: false,
    });

    if (bodyError.error) {
      const errors = bodyError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { orderId } = paramError.value;
    const { status } = bodyError.value;

    const order = await orderService.updateOrderStatus(orderId, status);

    return sendSuccess(
      res,
      order,
      "Order status updated successfully",
      StatusCodes.OK
    );
  }),

  // Cancel order
  cancelOrder: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = orderIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";
    const order = await orderService.cancelOrder(
      value.orderId,
      userId,
      isAdmin
    );

    return sendSuccess(
      res,
      order,
      "Order cancelled successfully",
      StatusCodes.OK
    );
  }),

  // Get order statistics (Admin only)
  getOrderStatistics: catchAsync(async (req, res) => {
    const stats = await orderService.getOrderStatistics();

    return sendSuccess(
      res,
      stats,
      "Order statistics retrieved successfully",
      StatusCodes.OK
    );
  }),
};

module.exports = OrderController;
