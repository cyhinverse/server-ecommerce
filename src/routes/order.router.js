const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/auth.middleware");

// User routes (require authentication)
router.post("/", verifyAccessToken, orderController.createOrder);
router.get("/", verifyAccessToken, orderController.getUserOrders);
router.get("/:orderId", verifyAccessToken, orderController.getOrderById);
router.delete(
  "/:orderId/cancel",
  verifyAccessToken,
  orderController.cancelOrder
);

// Admin routes (require admin role)
router.get(
  "/all/list",
  verifyAccessToken,
  requireRole("admin"),
  orderController.getAllOrders
);
router.put(
  "/:orderId/status",
  verifyAccessToken,
  requireRole("admin"),
  orderController.updateOrderStatus
);
router.get(
  "/statistics/overview",
  verifyAccessToken,
  requireRole("admin"),
  orderController.getOrderStatistics
);

module.exports = router;
