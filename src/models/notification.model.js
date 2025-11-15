const { Schema, model, Types } = require("mongoose");

const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true }, // ai nhận thông báo
    type: {
      type: String,
      enum: [
        "order_status", // cập nhật trạng thái đơn hàng
        "promotion", // khuyến mãi
      ],
      default: "system",
    },
    title: { type: String, required: true }, // ví dụ: "Đơn hàng #1234 đã được giao"
    message: { type: String, required: true },
    orderId: { type: Types.ObjectId, ref: "Order" }, // nếu liên quan đến đơn hàng
    link: { type: String }, // ví dụ: "/orders/1234"
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true, collection: "notifications" }
);

module.exports = model("Notification", notificationSchema);
