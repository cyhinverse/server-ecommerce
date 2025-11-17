const Notification = require("../models/notification.model.js");

class NotificationService {
  constructor() {
    this.io = null;
  }

  // 🎯 SET IO INSTANCE
  setIO(ioInstance) {
    this.io = ioInstance;
    this.setupSocketHandlers();
    console.log('🔌 Socket.IO initialized for NotificationService');
  }

  // 🎯 SETUP SOCKET HANDLERS
  setupSocketHandlers() {
    if (!this.io) {
      throw new Error("Socket.IO chưa được khởi tạo");
    }

    this.io.on("connection", (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // 1. Join notification room
      socket.on("join_notification_room", (userId) => {
        this.handleJoinRoom(socket, userId);
      });

      // 2. Get notifications
      socket.on("get_notifications", async (data) => {
        await this.handleGetNotifications(socket, data);
      });

      // 3. Mark as read
      socket.on("mark_notification_read", async (data) => {
        await this.handleMarkAsRead(socket, data);
      });

      // 4. Mark all as read
      socket.on("mark_all_read", async (data) => {
        await this.handleMarkAllAsRead(socket, data);
      });

      // 5. Get unread count
      socket.on("get_unread_count", async (data) => {
        await this.handleGetUnreadCount(socket, data);
      });

      socket.on("disconnect", () => {
        console.log(`🔗 Client disconnected: ${socket.id}`);
      });
    });
  }

  // ==============================================
  // 🎯 5 CORE SOCKET HANDLERS
  // ==============================================

  async handleJoinRoom(socket, userId) {
    try {
      if (!userId) {
        throw new Error("User ID là bắt buộc");
      }

      socket.join(`user_${userId}`);

      socket.emit("room_joined", {
        success: true,
        room: `user_${userId}`,
        message: "Đã tham gia phòng thông báo"
      });

      console.log(`🔔 User ${userId} joined notification room`);
    } catch (error) {
      socket.emit("room_join_error", {
        success: false,
        message: error.message
      });
    }
  }

  async handleGetNotifications(socket, data) {
    try {
      const { userId, page = 1, limit = 20, isRead } = data;

      if (!userId) {
        throw new Error("User ID là bắt buộc");
      }

      const filter = { userId };
      if (isRead !== undefined) filter.isRead = isRead;

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate("userId", "name email")
        .populate("orderId", "orderNumber status");

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      socket.emit("notifications_data", {
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount
      });

    } catch (error) {
      socket.emit("notifications_error", {
        success: false,
        message: error.message
      });
    }
  }

  async handleMarkAsRead(socket, data) {
    try {
      const { notificationId, userId } = data;

      if (!notificationId || !userId) {
        throw new Error("Thiếu notificationId hoặc userId");
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      ).populate("userId", "name email");

      if (!notification) {
        throw new Error("Không tìm thấy thông báo");
      }

      socket.emit("mark_read_success", {
        success: true,
        data: notification,
        message: "Đã đánh dấu đã đọc"
      });

    } catch (error) {
      socket.emit("mark_read_error", {
        success: false,
        message: error.message
      });
    }
  }

  async handleMarkAllAsRead(socket, data) {
    try {
      const { userId } = data;

      if (!userId) {
        throw new Error("User ID là bắt buộc");
      }

      const result = await Notification.updateMany(
        { userId, isRead: false },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      socket.emit("mark_all_read_success", {
        success: true,
        modifiedCount: result.modifiedCount,
        message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`
      });

    } catch (error) {
      socket.emit("mark_all_read_error", {
        success: false,
        message: error.message
      });
    }
  }

  async handleGetUnreadCount(socket, data) {
    try {
      const { userId } = data;

      if (!userId) {
        throw new Error("User ID là bắt buộc");
      }

      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      socket.emit("unread_count_data", {
        success: true,
        unreadCount,
        userId
      });

    } catch (error) {
      socket.emit("unread_count_error", {
        success: false,
        message: error.message
      });
    }
  }

  // ==============================================
  // 🎯 5 CORE SERVER METHODS
  // ==============================================

  // 1. Tạo và gửi thông báo
  async createAndSendNotification(notificationData) {
    try {
      if (!this.io) {
        throw new Error("Socket.IO chưa được khởi tạo");
      }

      const notification = await Notification.create(notificationData);
      await notification.populate("userId", "name email");

      if (notificationData.orderId) {
        await notification.populate("orderId", "orderNumber status");
      }

      // Gửi real-time
      this.io.to(`user_${notificationData.userId}`).emit('new_notification', {
        success: true,
        data: notification
      });

      return notification;

    } catch (error) {
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  }

  // 2. Thông báo đơn hàng
  async notifyOrderStatus(order, status) {
    const statusMessages = {
      'pending': 'đang chờ xử lý',
      'confirmed': 'đã được xác nhận',
      'shipping': 'đang vận chuyển',
      'delivered': 'đã giao hàng thành công',
      'cancelled': 'đã bị hủy'
    };

    return this.createAndSendNotification({
      userId: order.userId,
      type: "order_status",
      title: "Cập nhật đơn hàng",
      message: `Đơn hàng #${order.orderNumber} ${statusMessages[status]}`,
      orderId: order._id,
      link: `/orders/${order._id}`
    });
  }

  // 3. Thông báo khuyến mãi
  async sendPromotion(userId, title, message, link = null) {
    return this.createAndSendNotification({
      userId,
      type: "promotion",
      title,
      message,
      link
    });
  }

  // 4. Thông báo hệ thống
  async sendSystemNotification(userId, title, message, link = null) {
    return this.createAndSendNotification({
      userId,
      type: "system",
      title,
      message,
      link
    });
  }

  // 5. Broadcast đến nhiều users
  async broadcastToUsers(userIds, notificationData) {
    try {
      if (!this.io) {
        throw new Error("Socket.IO chưa được khởi tạo");
      }

      const notifications = await Promise.all(
        userIds.map(userId =>
          Notification.create({
            userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            link: notificationData.link
          })
        )
      );

      // Gửi real-time đến tất cả users
      userIds.forEach(userId => {
        this.io.to(`user_${userId}`).emit('new_notification', {
          success: true,
          data: {
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            link: notificationData.link
          }
        });
      });

      return notifications;

    } catch (error) {
      console.error('❌ Error broadcasting:', error);
      throw error;
    }
  }

  // ==============================================
  // 🎯 HTTP API METHODS
  // ==============================================

  async getUserNotifications(userId, query = {}) {
    const { page = 1, limit = 20, isRead } = query;

    const filter = { userId };
    if (isRead !== undefined) filter.isRead = isRead;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "name email")
      .populate("orderId", "orderNumber status");

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    return {
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount
    };
  }

  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  async getUnreadCount(userId) {
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    return { unreadCount };
  }
}

module.exports = new NotificationService();
