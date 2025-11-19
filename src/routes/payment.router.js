const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/payment.controller");
const { verifyAccessToken } = require("../middlewares/auth.middleware");

// Protected routes (require authentication)
router.post("/create", verifyAccessToken, PaymentController.createPayment);
router.get("/order/:orderId", verifyAccessToken, PaymentController.getPaymentByOrder);

// Public routes (VNPay callbacks)
router.get("/vnpay-return", PaymentController.handleVnpayReturn);
router.get("/vnpay-ipn", PaymentController.handleVnpayIPN);

module.exports = router;
