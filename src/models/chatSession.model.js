const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant", "system"],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        messages: [messageSchema],
        context: {
            // Track conversation context
            currentIntent: {
                type: String,
                default: null,
            },
            entities: {
                type: Map,
                of: mongoose.Schema.Types.Mixed,
                default: new Map(),
            },
            conversationState: {
                type: String,
                enum: [
                    "idle",
                    "awaiting_product_selection",
                    "awaiting_order_confirmation",
                    "awaiting_address_update",
                    "awaiting_payment_method",
                    // New conversion funnel states
                    "discovery",
                    "interest",
                    "decision",
                    "purchase",
                    "retention",
                ],
                default: "idle",
            },
            lastMentionedProduct: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                default: null,
            },
            lastMentionedOrder: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order",
                default: null,
            },
            cartContext: {
                type: mongoose.Schema.Types.Mixed,
                default: {},
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastActiveAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
    },
    { timestamps: true }
);

// Index for cleanup of expired sessions
chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update lastActiveAt on save
chatSessionSchema.pre("save", function (next) {
    this.lastActiveAt = new Date();
    next();
});

// Method to add a message
chatSessionSchema.methods.addMessage = function (role, content, metadata = {}) {
    this.messages.push({ role, content, metadata });
    return this.save();
};

// Method to update context
chatSessionSchema.methods.updateContext = function (contextUpdate) {
    this.context = { ...this.context, ...contextUpdate };
    return this.save();
};

// Method to reset context
chatSessionSchema.methods.resetContext = function () {
    this.context = {
        currentIntent: null,
        entities: new Map(),
        conversationState: "idle",
        lastMentionedProduct: null,
        lastMentionedOrder: null,
        cartContext: {},
    };
    return this.save();
};

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = ChatSession;
