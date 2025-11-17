const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const {requireRole} =  require("../middlewares/auth.middleware.js")

router.use(requireRole);

router.get("/", notificationController.getAllNotifications);
router.post("/", notificationController.createNotification);
router.put("/:notificationId/read", notificationController.markAsRead);
router.get("/unread-count", notificationController.getUnreadCount);
router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;
