const { GoogleGenerativeAI } = require("@google/generative-ai");
const functionDeclarations = require("./functionDeclarations");
const { createFunctionMap } = require("./functionMap");

/**
 * Intent Classifier - Uses Google Gemini to classify user intent and execute functions
 * Now with modular structure for better maintainability
 */
class IntentClassifier {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        this.functionDeclarations = functionDeclarations;
    }

    /**
     * Classify intent and extract entities using Google Gemini
     */
    async classify(userMessage, conversationHistory = [], userId) {
        try {
            // Build valid history for Gemini
            // Gemini requires history to start with 'user' role
            let validHistory = [...conversationHistory];
            
            // Remove leading non-user messages
            while (validHistory.length > 0 && validHistory[0].role !== "user") {
                validHistory.shift();
            }

            const history = validHistory.map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            }));

            // Start chat with function calling
            const chat = this.model.startChat({
                history: history,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                },
                tools: [
                    {
                        functionDeclarations: this.functionDeclarations,
                    },
                ],
            });

            // Send message
            const result = await chat.sendMessage(userMessage);
            const response = result.response;

            // Check if function call is requested
            const functionCall = response.candidates[0]?.content?.parts?.find(
                (part) => part.functionCall
            );

            if (functionCall) {
                return {
                    type: "function_call",
                    functionName: functionCall.functionCall.name,
                    arguments: functionCall.functionCall.args,
                    rawResponse: response,
                };
            }

            // No function call, return text response
            return {
                type: "text",
                content: response.text(),
            };
        } catch (error) {
            console.error("Intent classification error:", error);
            throw error;
        }
    }

    /**
     * Execute the classified function
     */
    async executeFunction(functionName, args, userId, ipAddress = null) {
        try {
            // Create function map with user context
            const functionMap = createFunctionMap(userId, ipAddress);

            const handler = functionMap[functionName];
            if (!handler) {
                return {
                    success: false,
                    message: `Function ${functionName} không tồn tại`,
                };
            }

            return await handler(args);
        } catch (error) {
            console.error(`Error executing function ${functionName}:`, error);
            return {
                success: false,
                message: `Lỗi khi thực hiện: ${error.message}`,
            };
        }
    }

    /**
     * Generate final response using Gemini after function execution
     * Includes improvement for empty response handling
     */
    async generateResponse(
        userMessage,
        functionResult,
        conversationHistory = []
    ) {
        try {
            // Build history
            // Gemini requires history to start with 'user' role
            let validHistory = [...conversationHistory];
            while (validHistory.length > 0 && validHistory[0].role !== "user") {
                validHistory.shift();
            }

            const history = validHistory.map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            }));

            const chat = this.model.startChat({
                history: history,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 500,
                },
            });

            const prompt = `Người dùng hỏi: "${userMessage}"

Kết quả từ hệ thống: ${JSON.stringify(functionResult, null, 2)}

Hãy tổng hợp và trả lời người dùng một cách thân thiện, ngắn gọn bằng tiếng Việt. Nếu có sản phẩm, voucher, đơn hàng, hãy giới thiệu chi tiết.`;

            const result = await chat.sendMessage(prompt);
            const responseText = result.response.text();

            // IMPROVEMENT: If AI response is empty or too short, use function message
            if (!responseText || responseText.trim().length < 10) {
                return (
                    functionResult.message || "Đã thực hiện xong yêu cầu của bạn!"
                );
            }

            return responseText;
        } catch (error) {
            console.error("Response generation error:", error);
            // Fallback to function result message
            return (
                functionResult.message || "Đã thực hiện xong yêu cầu của bạn!"
            );
        }
    }
}

module.exports = new IntentClassifier();
