const joi = require("joi");

// ObjectId validator
const objectId = joi
  .string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    "string.base": "{{#label}} must be a string",
    "string.pattern.base": "{{#label}} must be a valid MongoDB ObjectId",
  });

// Get all notifications validator
const getNotificationsQueryValidator = joi.object({
  page: joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
  isRead: joi.boolean().messages({
    "boolean.base": "isRead must be a boolean",
  }),
});

// Get unread notifications validator
const getUnreadNotificationsValidator = joi.object({
  limit: joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),
});

// Mark as read validator
const markAsReadValidator = joi.object({
  notificationId: objectId.required().messages({
    "any.required": "Notification ID is required",
  }),
});

// Delete notification validator
const deleteNotificationValidator = joi.object({
  notificationId: objectId.required().messages({
    "any.required": "Notification ID is required",
  }),
});

// Create notification validator
const createNotificationValidator = joi.object({
  userId: objectId.required().messages({
    "any.required": "User ID is required",
  }),
  type: joi.string().valid("order_status", "promotion").required().messages({
    "string.base": "Type must be a string",
    "any.only": "Type must be either 'order_status' or 'promotion'",
    "any.required": "Type is required",
  }),
  title: joi.string().max(255).required().messages({
    "string.base": "Title must be a string",
    "string.max": "Title cannot exceed 255 characters",
    "any.required": "Title is required",
  }),
  message: joi.string().max(1000).required().messages({
    "string.base": "Message must be a string",
    "string.max": "Message cannot exceed 1000 characters",
    "any.required": "Message is required",
  }),
  orderId: objectId.messages({
    "string.pattern.base": "Order ID must be a valid MongoDB ObjectId",
  }),
  link: joi.string().uri().max(500).messages({
    "string.uri": "Link must be a valid URL",
    "string.max": "Link cannot exceed 500 characters",
  }),
});

// Socket get notifications validator
const socketGetNotificationsValidator = joi.object({
  userId: objectId.required().messages({
    "any.required": "User ID is required",
  }),
  limit: joi.number().integer().min(1).max(50).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),
  page: joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  isRead: joi.boolean().messages({
    "boolean.base": "isRead must be a boolean",
  }),
});

// Socket mark as read validator
const socketMarkAsReadValidator = joi.object({
  notificationId: objectId.required().messages({
    "any.required": "Notification ID is required",
  }),
  userId: objectId.required().messages({
    "any.required": "User ID is required",
  }),
});

module.exports = {
  getNotificationsQueryValidator,
  getUnreadNotificationsValidator,
  markAsReadValidator,
  deleteNotificationValidator,
  createNotificationValidator,
  socketGetNotificationsValidator,
  socketMarkAsReadValidator,
};