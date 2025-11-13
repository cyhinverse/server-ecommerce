const catchAsync = require("../configs/catchAsync");
const cartService = require("../services/cart.service");
const { StatusCodes } = require("http-status-codes");
const { sendSuccess, sendFail } = require("../shared/res/formatResponse");
const {
  addToCartValidator,
  updateCartItemValidator,
  cartItemIdValidator,
} = require("../validations/cart.validator");

const CartController = {
  // Get user's cart
  getCart: catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const cart = await cartService.getCart(userId);

    return sendSuccess(
      res,
      cart,
      "Cart retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Add item to cart
  addToCart: catchAsync(async (req, res) => {
    // Validate request body
    const { error, value } = addToCartValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const cart = await cartService.addToCart(userId, value);

    return sendSuccess(
      res,
      cart,
      "Item added to cart successfully",
      StatusCodes.OK
    );
  }),

  // Update cart item quantity
  updateCartItem: catchAsync(async (req, res) => {
    // Validate params
    const paramError = cartItemIdValidator.validate(req.params, {
      abortEarly: false,
    });

    if (paramError.error) {
      const errors = paramError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate body
    const bodyError = updateCartItemValidator.validate(req.body, {
      abortEarly: false,
    });

    if (bodyError.error) {
      const errors = bodyError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const { itemId } = paramError.value;
    const { quantity } = bodyError.value;

    const cart = await cartService.updateCartItem(userId, itemId, quantity);

    return sendSuccess(
      res,
      cart,
      "Cart item updated successfully",
      StatusCodes.OK
    );
  }),

  // Remove item from cart
  removeCartItem: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = cartItemIdValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const { itemId } = value;

    const cart = await cartService.removeCartItem(userId, itemId);

    return sendSuccess(
      res,
      cart,
      "Item removed from cart successfully",
      StatusCodes.OK
    );
  }),

  // Clear cart
  clearCart: catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const cart = await cartService.clearCart(userId);

    return sendSuccess(res, cart, "Cart cleared successfully", StatusCodes.OK);
  }),

  // Get cart item count
  getCartItemCount: catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const count = await cartService.getCartItemCount(userId);

    return sendSuccess(
      res,
      { count },
      "Cart item count retrieved successfully",
      StatusCodes.OK
    );
  }),
};

module.exports = CartController;
