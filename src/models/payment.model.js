const {Schema, model, Types} = require("mongoose");

const paymentSchema = new Schema({
    orderId: {
        type: Types.ObjectId,
        ref: "Order",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "vnpay"],
        default: "cod",
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid",
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    paymentGateway: {
        type: String,
        default: "vnpay",
    },

}, {
    timestamps: true,
    collection: "payments",
});

module.exports = model("Payment", paymentSchema);
