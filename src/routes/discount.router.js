const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discount.controller");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/auth.middleware");

// Public routes (no authentication required)
router.get("/active", discountController.getActiveDiscounts);
router.get("/code/:code", discountController.getDiscountByCode);

// User routes (require authentication)
router.post("/apply", verifyAccessToken, discountController.applyDiscount);

// Admin routes (require admin role)
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin"),
  discountController.createDiscount
);
router.get(
  "/",
  verifyAccessToken,
  requireRole("admin"),
  discountController.getAllDiscounts
);
router.get(
  "/statistics",
  verifyAccessToken,
  requireRole("admin"),
  discountController.getDiscountStatistics
);
router.get(
  "/:discountId",
  verifyAccessToken,
  requireRole("admin"),
  discountController.getDiscountById
);
router.put(
  "/:discountId",
  verifyAccessToken,
  requireRole("admin"),
  discountController.updateDiscount
);
router.delete(
  "/:discountId",
  verifyAccessToken,
  requireRole("admin"),
  discountController.deleteDiscount
);

module.exports = router;
