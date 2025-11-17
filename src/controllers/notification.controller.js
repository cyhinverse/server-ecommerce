const notificationService = require("../services/notification.service");

const notificationController = {
  // 1. Lấy thông báo
  getAllNotifications: async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const result = await notificationService.getUserNotifications(req.user.id, limit);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },



  // 2. Tạo thông báo
  createNotification: async (req, res) => {
    try {
      const { userId, type, title, message } = req.body;
      const result = await notificationService.createAndSendNotification({
        userId,
        type,
        title,
        message
      });
      res.status(201).json({
        success: true,
        data: result,
        message: "Notification created"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // 3. Đánh dấu đã đọc
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const result = await notificationService.markAsRead(notificationId, req.user.id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Marked as read"
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  },

  // 4. Lấy số chưa đọc
  getUnreadCount: async (req, res) => {
    try {
      const result = await notificationService.getUnreadCount(req.user.id);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },


  // 5. Xóa thông báo
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const result = await notificationService.deleteNotification(notificationId, req.user.id);
      res.status(200).json({
        success: true,
        data: result,
        message: "Notification deleted"
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
};



module.exports = notificationController;
