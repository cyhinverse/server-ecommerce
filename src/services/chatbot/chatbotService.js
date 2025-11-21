const intentClassifier = require("./intentClassifier");
const contextManager = require("./contextManager");

/**
 * Main Chatbot Service - Orchestrates the entire chatbot flow
 */
class ChatbotService {
    /**
     * Process a user message and generate response
     */
    async processMessage(userId, message, sessionId = null, ipAddress = null) {
        try {
            // 1. Get or create session
            const session = await contextManager.getOrCreateSession(
                userId,
                sessionId
            );

            // 2. Add user message to session
            await contextManager.addMessage(session.sessionId, "user", message);

            // 3. Get conversation history for context
            const history = await contextManager.getConversationHistory(
                session.sessionId,
                10
            );

            // 4. Classify intent using AI
            const classification = await intentClassifier.classify(
                message,
                history,
                userId
            );

            let responseContent;
            let functionResult = null;
            let responseData = null;

            // 5. Handle classification result
            if (classification.type === "function_call") {
                // Execute the function
                functionResult = await intentClassifier.executeFunction(
                    classification.functionName,
                    classification.arguments,
                    userId,
                    ipAddress
                );

                // Update context based on function result
                await this.updateContextFromFunction(
                    session.sessionId,
                    classification.functionName,
                    functionResult
                );

                // Generate natural language response
                responseContent = await intentClassifier.generateResponse(
                    message,
                    functionResult,
                    history
                );

                responseData = functionResult.data;
            } else {
                // Direct text response from AI
                responseContent = classification.content;
            }

            // Ensure responseContent is not empty
            if (!responseContent || typeof responseContent !== "string" || responseContent.trim() === "") {
                responseContent = "Xin lỗi, tôi không hiểu ý bạn. Bạn có thể nói rõ hơn không?";
            }

            // 6. Add assistant response to session
            await contextManager.addMessage(
                session.sessionId,
                "assistant",
                responseContent,
                {
                    functionCalled: classification.functionName,
                    functionResult: functionResult,
                }
            );

            // 7. Return response
            return {
                success: true,
                sessionId: session.sessionId,
                message: responseContent,
                data: responseData,
                metadata: {
                    intent: classification.functionName || "general_conversation",
                    functionCalled: classification.type === "function_call",
                },
            };
        } catch (error) {
            console.error("Chatbot processing error:", error);
            return {
                success: false,
                error: error.message,
                message:
                    "Xin lỗi, tôi gặp chút vấn đề kỹ thuật. Bạn có thể thử lại không?",
            };
        }
    }

    /**
     * Update context based on function execution
     */
    async updateContextFromFunction(sessionId, functionName, result) {
        try {
            const contextUpdate = {};

            // Update context based on function type
            if (functionName === "search_products" && result.success) {
                contextUpdate.currentIntent = "product_search";
                contextUpdate.conversationState = "awaiting_product_selection";
            } else if (functionName === "get_product_details" && result.success) {
                contextUpdate.lastMentionedProduct = result.data?._id;
                contextUpdate.currentIntent = "product_details";
            } else if (functionName === "add_to_cart" && result.success) {
                contextUpdate.currentIntent = "cart_management";
                contextUpdate.conversationState = "idle";
            } else if (functionName === "check_order_status" && result.success) {
                contextUpdate.lastMentionedOrder = result.data?.orderId;
                contextUpdate.currentIntent = "order_tracking";
            } else if (functionName === "view_cart" && result.success) {
                contextUpdate.cartContext = result.data?.cart;
                contextUpdate.currentIntent = "cart_view";
            }

            if (Object.keys(contextUpdate).length > 0) {
                await contextManager.updateContext(sessionId, contextUpdate);
            }
        } catch (error) {
            console.error("Context update error:", error);
        }
    }

    /**
     * Get session history
     */
    async getSessionHistory(sessionId) {
        try {
            const session = await contextManager.getSession(sessionId);
            if (!session) {
                return {
                    success: false,
                    message: "Không tìm thấy phiên chat.",
                };
            }

            return {
                success: true,
                data: {
                    sessionId: session.sessionId,
                    messages: session.messages,
                    context: session.context,
                    createdAt: session.createdAt,
                    lastActiveAt: session.lastActiveAt,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy lịch sử chat.",
            };
        }
    }

    /**
     * Clear session
     */
    async clearSession(sessionId) {
        try {
            await contextManager.clearContext(sessionId);
            return {
                success: true,
                message: "Đã xóa lịch sử chat.",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể xóa lịch sử chat.",
            };
        }
    }

    /**
     * Get suggested quick replies
     */
    getSuggestions(context = {}) {
        const baseSuggestions = [
            "Tìm sản phẩm",
            "Xem giỏ hàng",
            "Đơn hàng của tôi",
            "Mã giảm giá",
        ];

        // Context-aware suggestions
        if (context.currentIntent === "product_search") {
            return [
                "Xem chi tiết sản phẩm này",
                "Thêm vào giỏ hàng",
                "Tìm sản phẩm khác",
                "So sánh giá",
            ];
        } else if (context.currentIntent === "cart_view") {
            return [
                "Thanh toán ngay",
                "Áp dụng mã giảm giá",
                "Cập nhật số lượng",
                "Xóa sản phẩm",
            ];
        } else if (context.currentIntent === "order_tracking") {
            return [
                "Hủy đơn hàng",
                "Cập nhật địa chỉ",
                "Thanh toán đơn hàng",
                "Xem đơn hàng khác",
            ];
        }

        return baseSuggestions;
    }

    /**
     * Get user's active sessions
     */
    async getUserSessions(userId) {
        try {
            const ChatSession = require("../../models/chatSession.model");
            const sessions = await ChatSession.find({
                userId,
                isActive: true,
            })
                .sort({ lastActiveAt: -1 })
                .limit(5)
                .select("sessionId createdAt lastActiveAt messages");

            return {
                success: true,
                data: sessions,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy danh sách phiên chat.",
            };
        }
    }
}

module.exports = new ChatbotService();
