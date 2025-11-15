const notificationService = require("../services/notificationService");
const {
  getNotificationsQueryValidator,
  getUnreadNotificationsValidator,
  markAsReadValidator,
  deleteNotificationValidator,
  createNotificationValidator,
} = require("./notification.validator");

const { sendSuccess, sendFail } = require("../utils/response");
const { StatusCodes } = require("http-status-codes");
const { catchAsync } = require("../utils/catchAsync");

const notificationController = {
  // 🎯 Lấy tất cả thông báo của user (HTTP API)
  getAllNotifications: catchAsync(async (req, res) => {
    const { error, value } = getNotificationsQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await notificationService.getUserNotifications(req.user.id, value);
    
    return sendSuccess(
      res,
      result,
      "Notifications retrieved successfully",
      StatusCodes.OK
    );
  }),

  // 🎯 Lấy thông báo chưa đọc (HTTP API)
  getUnreadNotifications: catchAsync(async (req, res) => {
    const { error, value } = getUnreadNotificationsValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await notificationService.getUserNotifications(req.user.id, {
      ...value,
      isRead: false
    });
    
    return sendSuccess(
      res,
      result,
      "Unread notifications retrieved successfully",
      StatusCodes.OK
    );
  }),

  // 🎯 Đánh dấu đã đọc (HTTP API)
  markAsRead: catchAsync(async (req, res) => {
    const { error, value } = markAsReadValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await notificationService.markNotificationAsRead(value.notificationId, req.user.id);
    
    return sendSuccess(
      res,
      result,
      "Notification marked as read",
      StatusCodes.OK
    );
  }),

  // 🎯 Đánh dấu tất cả là đã đọc (HTTP API)
  markAllAsRead: catchAsync(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user.id);
    
    return sendSuccess(
      res,
      result,
      `${result.modifiedCount} notifications marked as read`,
      StatusCodes.OK
    );
  }),

  // 🎯 Xóa thông báo (HTTP API)
  deleteNotification: catchAsync(async (req, res) => {
    const { error, value } = deleteNotificationValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await notificationService.deleteNotification(value.notificationId, req.user.id);
    
    return sendSuccess(
      res,
      result,
      "Notification deleted successfully",
      StatusCodes.OK
    );
  }),

  // 🎯 Tạo thông báo mới (Admin/System - HTTP API)
  createNotification: catchAsync(async (req, res) => {
    const { error, value } = createNotificationValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await notificationService.createAndSendNotification(value);
    
    return sendSuccess(
      res,
      result,
      "Notification created and sent successfully",
      StatusCodes.CREATED
    );
  }),

  // 🎯 Lấy số lượng thông báo chưa đọc (HTTP API)
  getUnreadCount: catchAsync(async (req, res) => {
    const result = await notificationService.getUnreadCount(req.user.id);
    
    return sendSuccess(
      res,
      result,
      "Unread count retrieved successfully",
      StatusCodes.OK
    );
  }),

  // 🎯 Gửi thông báo khuyến mãi (Admin - HTTP API)
  sendPromotion: catchAsync(async (req, res) => {
    const { userId, title, message, link } = req.body;
    
    const result = await notificationService.sendPromotion(userId, {
      title,
      message,
      link
    });
    
    return sendSuccess(
      res,
      result,
      "Promotion notification sent successfully",
      StatusCodes.OK
    );
  }),

  // 🎯 Broadcast khuyến mãi đến nhiều users (Admin - HTTP API)
  broadcastPromotion: catchAsync(async (req, res) => {
    const { userIds, title, message, link } = req.body;
    
    const result = await notificationService.broadcastPromotion(userIds, {
      title,
      message,
      link
    });
    
    return sendSuccess(
      res,
      { sentCount: userIds.length },
      `Promotion broadcast to ${userIds.length} users`,
      StatusCodes.OK
    );
  })
};

module.exports = notificationController;