const Notification = require("../models/Notification");
const { io } = require("../app");

class NotificationService {
  constructor() {
    this.setupSocketHandlers();
  }

  // 🎯 SETUP SOCKET HANDLERS TRỰC TIẾP
  setupSocketHandlers() {
    io.on("connection", (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // 🎯 CLIENT → SERVER: Join room
      socket.on("join_notification_room", (userId) => {
        this.handleJoinRoom(socket, userId);
      });

      // 🎯 CLIENT → SERVER: Request notification
      socket.on("request_notification", async (data) => {
        await this.handleClientRequest(socket, data);
      });

      // 🎯 CLIENT → SERVER: Mark as read
      socket.on("mark_notification_read", async (data) => {
        await this.handleMarkAsRead(socket, data);
      });

      // 🎯 CLIENT → SERVER: Get notifications
      socket.on("get_notifications", async (data) => {
        await this.handleGetNotifications(socket, data);
      });

      // 🎯 CLIENT → SERVER: Mark all as read
      socket.on("mark_all_read", async (data) => {
        await this.handleMarkAllAsRead(socket, data);
      });

      // 🎯 CLIENT → SERVER: Get unread count
      socket.on("get_unread_count", async (data) => {
        await this.handleGetUnreadCount(socket, data);
      });

      socket.on("disconnect", () => {
        console.log(`🔗 Client disconnected: ${socket.id}`);
      });
    });
  }

  // ==============================================
  // 🎯 SOCKET HANDLERS (CLIENT → SERVER → CLIENT)
  // ==============================================

  async handleJoinRoom(socket, userId) {
    try {
      socket.join(`user_${userId}`);
      
      // 🎯 SERVER → CLIENT: Confirmation
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

  async handleClientRequest(socket, data) {
    try {
      const { userId, title, message, type = "promotion" } = data;
      
      const notification = await Notification.create({
        userId,
        type,
        title,
        message
      });

      await notification.populate("userId", "name email");

      // 🎯 SERVER → CLIENT: Send the created notification
      socket.emit("notification_created", {
        success: true,
        data: notification,
        message: "Thông báo đã được tạo thành công"
      });

      console.log(`📨 Client-requested notification created for user ${userId}`);
    } catch (error) {
      socket.emit("notification_error", {
        success: false,
        message: error.message
      });
    }
  }

  async handleMarkAsRead(socket, data) {
    try {
      const { notificationId, userId } = data;
      
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

      // 🎯 SERVER → CLIENT: Confirmation
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

  async handleGetNotifications(socket, data) {
    try {
      const { userId, page = 1, limit = 20, isRead } = data;
      
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

      // 🎯 SERVER → CLIENT: Send notifications data
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

  async handleMarkAllAsRead(socket, data) {
    try {
      const { userId } = data;
      
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      // 🎯 SERVER → CLIENT: Confirmation
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
      
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      // 🎯 SERVER → CLIENT: Send count
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
  // 🎯 SERVER → CLIENT METHODS (Auto/HTTP-triggered)
  // ==============================================

  // 🎯 Tạo và gửi thông báo tự động
  async createAndSendNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      await notification.populate("userId", "name email");
      if (notificationData.orderId) {
        await notification.populate("orderId", "orderNumber status");
      }

      // 🎯 SERVER → CLIENT: Real-time emission
      io.to(`user_${notificationData.userId}`).emit('new_notification', {
        success: true,
        data: notification,
        type: 'auto'
      });

      console.log(`🔔 Auto notification sent to user_${notificationData.userId}`);
      return notification;

    } catch (error) {
      console.error('❌ Error sending auto notification:', error);
      throw error;
    }
  }

  // 🎯 Thông báo đơn hàng mới
  async notifyNewOrder(order) {
    return this.createAndSendNotification({
      userId: order.userId,
      type: "order_status",
      title: "Đơn hàng mới",
      message: `Đơn hàng #${order.orderNumber} đã được tạo thành công`,
      orderId: order._id,
      link: `/orders/${order._id}`
    });
  }

  // 🎯 Thông báo cập nhật trạng thái đơn hàng
  async notifyOrderStatusUpdate(order, newStatus) {
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
      message: `Đơn hàng #${order.orderNumber} ${statusMessages[newStatus]}`,
      orderId: order._id,
      link: `/orders/${order._id}`
    });
  }

  // 🎯 Gửi thông báo khuyến mãi
  async sendPromotion(userId, promotionData) {
    return this.createAndSendNotification({
      userId,
      type: "promotion",
      title: promotionData.title,
      message: promotionData.message,
      link: promotionData.link
    });
  }

  // 🎯 Broadcast promotion đến nhiều users
  async broadcastPromotion(userIds, promotionData) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => 
          Notification.create({
            userId,
            type: "promotion",
            title: promotionData.title,
            message: promotionData.message,
            link: promotionData.link
          })
        )
      );

      // 🎯 SERVER → CLIENT: Broadcast real-time
      userIds.forEach(userId => {
        io.to(`user_${userId}`).emit('promotion_notification', {
          success: true,
          data: {
            title: promotionData.title,
            message: promotionData.message,
            link: promotionData.link
          }
        });
      });

      console.log(`📢 Promotion broadcast to ${userIds.length} users`);
      return notifications;

    } catch (error) {
      console.error('❌ Error broadcasting promotion:', error);
      throw error;
    }
  }

  // ==============================================
  // 🎯 QUERY METHODS (cho HTTP API)
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

  async markNotificationAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).populate("userId", "name email");

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
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

  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }
}

module.exports = new NotificationService();