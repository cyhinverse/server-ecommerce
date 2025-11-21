const chatbotService = require("../services/chatbot/chatbotService");
const catchAsync = require("../configs/catchAsync");
const { StatusCodes } = require("http-status-codes");

/**
 * Send a message to chatbot
 * POST /api/chatbot/message
 */
const sendMessage = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const { message, sessionId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!message || message.trim() === "") {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Tin nhắn không được để trống.",
        });
    }

    const result = await chatbotService.processMessage(
        userId,
        message,
        sessionId,
        ipAddress
    );

    res.status(StatusCodes.OK).json(result);
});

/**
 * Get session history
 * GET /api/chatbot/session/:sessionId
 */
const getSessionHistory = catchAsync(async (req, res) => {
    const { sessionId } = req.params;

    const result = await chatbotService.getSessionHistory(sessionId);

    res.status(StatusCodes.OK).json(result);
});

/**
 * Clear session
 * DELETE /api/chatbot/session/:sessionId
 */
const clearSession = catchAsync(async (req, res) => {
    const { sessionId } = req.params;

    const result = await chatbotService.clearSession(sessionId);

    res.status(StatusCodes.OK).json(result);
});

/**
 * Get suggested quick replies
 * GET /api/chatbot/suggestions
 */
const getSuggestions = catchAsync(async (req, res) => {
    const { sessionId } = req.query;

    let context = {};
    if (sessionId) {
        const sessionResult = await chatbotService.getSessionHistory(sessionId);
        if (sessionResult.success) {
            context = sessionResult.data.context;
        }
    }

    const suggestions = chatbotService.getSuggestions(context);

    res.status(StatusCodes.OK).json({
        success: true,
        data: suggestions,
    });
});

/**
 * Get user's chat sessions
 * GET /api/chatbot/sessions
 */
const getUserSessions = catchAsync(async (req, res) => {
    const userId = req.user.userId;

    const result = await chatbotService.getUserSessions(userId);

    res.status(StatusCodes.OK).json(result);
});

module.exports = {
    sendMessage,
    getSessionHistory,
    clearSession,
    getSuggestions,
    getUserSessions,
};
