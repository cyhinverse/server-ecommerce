const Joi = require("joi");

/**
 * Validation schemas for chatbot requests
 */
const chatbotValidation = {
    // Validate send message request
    sendMessage: Joi.object({
        message: Joi.string().required().min(1).max(1000).messages({
            "string.empty": "Tin nhắn không được để trống",
            "string.min": "Tin nhắn quá ngắn",
            "string.max": "Tin nhắn quá dài (tối đa 1000 ký tự)",
            "any.required": "Tin nhắn là bắt buộc",
        }),
        sessionId: Joi.string().optional().allow(null, ""),
    }),

    // Validate session ID parameter
    sessionId: Joi.object({
        sessionId: Joi.string().required().messages({
            "string.empty": "Session ID không được để trống",
            "any.required": "Session ID là bắt buộc",
        }),
    }),
};

module.exports = chatbotValidation;
