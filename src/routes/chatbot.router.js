const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbot.controller");
const { verifyAccessToken } = require("../middlewares/auth.middleware");
const chatbotValidation = require("../validations/chatbot.validation");

/**
 * Validation middleware
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        next();
    };
};

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to chatbot
 * @access  Private (requires authentication)
 */
router.post(
    "/message",
    verifyAccessToken,
    validate(chatbotValidation.sendMessage),
    chatbotController.sendMessage
);

/**
 * @route   GET /api/chatbot/session/:sessionId
 * @desc    Get session history
 * @access  Private
 */
router.get(
    "/session/:sessionId",
    verifyAccessToken,
    chatbotController.getSessionHistory
);

/**
 * @route   DELETE /api/chatbot/session/:sessionId
 * @desc    Clear/delete session
 * @access  Private
 */
router.delete(
    "/session/:sessionId",
    verifyAccessToken,
    chatbotController.clearSession
);

/**
 * @route   GET /api/chatbot/suggestions
 * @desc    Get suggested quick replies
 * @access  Private
 */
router.get("/suggestions", verifyAccessToken, chatbotController.getSuggestions);

/**
 * @route   GET /api/chatbot/sessions
 * @desc    Get user's chat sessions
 * @access  Private
 */
router.get("/sessions", verifyAccessToken, chatbotController.getUserSessions);

module.exports = router;
