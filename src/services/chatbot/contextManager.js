const ChatSession = require("../../models/chatSession.model");

/**
 * Context Manager - Manage conversation context and session state
 */
class ContextManager {
    /**
     * Get or create session for user
     */
    async getOrCreateSession(userId, sessionId = null) {
        try {
            let session;

            if (sessionId) {
                // Try to find existing session
                session = await ChatSession.findOne({
                    sessionId,
                    userId,
                    isActive: true,
                });
            }

            // Create new session if not found
            if (!session) {
                const newSessionId = `${userId}_${Date.now()}`;
                session = new ChatSession({
                    userId,
                    sessionId: newSessionId,
                    messages: [],
                    context: {
                        currentIntent: null,
                        entities: {},
                        conversationState: "discovery", // ✅ Funnel stage tracking
                        funnelMetadata: {
                            stage: "discovery",
                            lastStageChange: new Date(),
                            stageHistory: ["discovery"],
                        },
                        currentProduct: null, // ✅ Context-aware product tracking
                        comparisonList: [],
                        cartState: null,
                        userPreferences: {},
                        lastAction: null,
                    },
                });
                await session.save();
            }

            return session;
        } catch (error) {
            throw new Error(`Failed to get/create session: ${error.message}`);
        }
    }

    /**
     * Add message to session
     */
    async addMessage(sessionId, role, content, metadata = {}) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            await session.addMessage(role, content, metadata);
            return session;
        } catch (error) {
            throw new Error(`Failed to add message: ${error.message}`);
        }
    }

    /**
     * Update session context
     */
    async updateContext(sessionId, contextUpdate) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            // Merge context
            const updatedContext = {
                ...session.context,
                ...contextUpdate,
            };

            // Handle entities separately (it's a Map)
            if (contextUpdate.entities) {
                updatedContext.entities = {
                    ...Object.fromEntries(session.context.entities || new Map()),
                    ...contextUpdate.entities,
                };
            }

            session.context = updatedContext;
            await session.save();

            return session;
        } catch (error) {
            throw new Error(`Failed to update context: ${error.message}`);
        }
    }

    /**
     * Get conversation context
     */
    async getContext(sessionId) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                return null;
            }

            return session.context;
        } catch (error) {
            throw new Error(`Failed to get context: ${error.message}`);
        }
    }

    /**
     * Get conversation history for AI
     * Includes product data from metadata for context awareness
     */
    async getConversationHistory(sessionId, limit = 10) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                return [];
            }

            // Return last N messages for context
            const messages = session.messages.slice(-limit);
            return messages.map((msg) => {
                let content = msg.content;

                // ✅ ENHANCEMENT: Include product data for AI context awareness
                if (msg.metadata && msg.metadata.functionResult) {
                    const result = msg.metadata.functionResult;

                    // If function returned products, append product info to content
                    if (result.data && Array.isArray(result.data.products)) {
                        const products = result.data.products;
                        if (products.length > 0) {
                            // Append product list with IDs for AI to reference
                            const productList = products
                                .slice(0, 3) // Only include first 3 for context
                                .map(
                                    (p) =>
                                        `[ID: ${p._id}, Name: "${p.name}", Price: ${p.variants?.[0]?.price || p.price}đ]`
                                )
                                .join(", ");

                            content += `\n[System Context - Products shown: ${productList}]`;
                        }
                    }

                    // If function returned single product
                    if (result.data && result.data.product && !result.data.products) {
                        const p = result.data.product;
                        content += `\n[System Context - Product shown: ID: ${p._id}, Name: "${p.name}"]`;
                    }
                }

                return {
                    role: msg.role,
                    content: content,
                };
            });
        } catch (error) {
            throw new Error(`Failed to get conversation history: ${error.message}`);
        }
    }

    /**
     * Store entity in context
     */
    async storeEntity(sessionId, entityName, entityValue) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            const entities = session.context.entities || new Map();
            entities.set(entityName, entityValue);

            session.context.entities = entities;
            await session.save();

            return session;
        } catch (error) {
            throw new Error(`Failed to store entity: ${error.message}`);
        }
    }

    /**
     * Get entity from context
     */
    async getEntity(sessionId, entityName) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session || !session.context.entities) {
                return null;
            }

            const entities = session.context.entities;
            return entities.get ? entities.get(entityName) : entities[entityName];
        } catch (error) {
            return null;
        }
    }

    /**
     * Update conversation state
     */
    async updateConversationState(sessionId, state) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            session.context.conversationState = state;
            await session.save();

            return session;
        } catch (error) {
            throw new Error(`Failed to update conversation state: ${error.message}`);
        }
    }

    /**
     * Clear session context
     */
    async clearContext(sessionId) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            await session.resetContext();
            return session;
        } catch (error) {
            throw new Error(`Failed to clear context: ${error.message}`);
        }
    }

    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        try {
            await ChatSession.findOneAndUpdate(
                { sessionId },
                { isActive: false },
                { new: true }
            );
            return true;
        } catch (error) {
            throw new Error(`Failed to delete session: ${error.message}`);
        }
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        try {
            return await ChatSession.findOne({ sessionId, isActive: true });
        } catch (error) {
            throw new Error(`Failed to get session: ${error.message}`);
        }
    }

    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const result = await ChatSession.deleteMany({
                expiresAt: { $lt: new Date() },
            });
            return result.deletedCount;
        } catch (error) {
            throw new Error(`Failed to cleanup sessions: ${error.message}`);
        }
    }

    /**
     * ========== CONVERSION-FOCUSED CONTEXT METHODS ==========
     */

    /**
     * Update conversation funnel stage
     * @param {string} sessionId - Session ID
     * @param {string} stage - Funnel stage: discovery, interest, decision, purchase, retention
     * @param {object} metadata - Additional metadata for the stage
     */
    async updateFunnelStage(sessionId, stage, metadata = {}) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            // Update funnel metadata
            session.context.conversationState = stage;
            session.context.funnelMetadata = {
                ...session.context.funnelMetadata,
                stage,
                lastStageChange: new Date(),
                stageHistory: [
                    ...(session.context.funnelMetadata?.stageHistory || []),
                    stage,
                ],
                ...metadata,
            };

            await session.save();
            return session;
        } catch (error) {
            throw new Error(`Failed to update funnel stage: ${error.message}`);
        }
    }

    /**
     * Store conversation entity for multi-turn context
     * @param {string} sessionId - Session ID
     * @param {string} entityType - Type: currentProduct, cartState, comparison, etc.
     * @param {object} entityData - Entity data to store
     */
    async storeConversationEntity(sessionId, entityType, entityData) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            // Initialize context fields if needed
            if (!session.context.entities) {
                session.context.entities = {};
            }

            // Store entity with timestamp
            session.context[entityType] = {
                ...entityData,
                storedAt: new Date(),
            };

            await session.save();
            return session;
        } catch (error) {
            throw new Error(
                `Failed to store conversation entity: ${error.message}`
            );
        }
    }

    /**
     * Get stored conversation entity
     * @param {string} sessionId - Session ID
     * @param {string} entityType - Type of entity to retrieve
     */
    async getConversationEntity(sessionId, entityType) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                return null;
            }

            return session.context[entityType] || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get next suggested actions based on current context
     * @param {string} sessionId - Session ID
     * @returns {Array} List of suggested function names
     */
    async getNextActions(sessionId) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                return [];
            }

            const stage = session.context.conversationState || "discovery";
            const currentProduct = session.context.currentProduct;
            const cartState = session.context.cartState;

            // Suggest actions based on funnel stage
            switch (stage) {
                case "discovery":
                    return [
                        "get_product_details",
                        "filter_products_by_price",
                        "get_hot_trending_products",
                    ];

                case "interest":
                    if (currentProduct) {
                        return [
                            "add_to_cart",
                            "get_similar_products",
                            "compare_products",
                            "get_product_reviews",
                        ];
                    }
                    return ["search_products", "browse_categories"];

                case "decision":
                    if (cartState && cartState.itemCount > 0) {
                        return [
                            "create_order_from_cart",
                            "get_best_voucher",
                            "view_cart",
                            "calculate_shipping_fee",
                        ];
                    }
                    return ["add_to_cart", "search_products"];

                case "purchase":
                    return [
                        "create_payment_link",
                        "check_order_status",
                        "add_delivery_address",
                    ];

                case "retention":
                    return [
                        "get_user_orders",
                        "create_product_review",
                        "recommend_products",
                        "get_new_arrivals",
                    ];

                default:
                    return [
                        "search_products",
                        "get_hot_trending_products",
                        "browse_categories",
                    ];
            }
        } catch (error) {
            return [];
        }
    }

    /**
     * Add product to comparison list
     * @param {string} sessionId - Session ID
     * @param {object} productData - Product data {id, name, price}
     */
    async addToComparison(sessionId, productData) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            if (!session.context.comparisonList) {
                session.context.comparisonList = [];
            }

            // Limit to 3 products for comparison
            if (session.context.comparisonList.length >= 3) {
                session.context.comparisonList.shift(); // Remove oldest
            }

            session.context.comparisonList.push(productData);
            await session.save();

            return session;
        } catch (error) {
            throw new Error(
                `Failed to add to comparison: ${error.message}`
            );
        }
    }

    /**
     * Update user preferences based on interactions
     * @param {string} sessionId - Session ID
     * @param {object} preferences - Preference updates {budget, categories, brands}
     */
    async updateUserPreferences(sessionId, preferences) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            session.context.userPreferences = {
                ...session.context.userPreferences,
                ...preferences,
                lastUpdated: new Date(),
            };

            await session.save();
            return session;
        } catch (error) {
            throw new Error(
                `Failed to update preferences: ${error.message}`
            );
        }
    }

    /**
     * Record last action for context continuity
     * @param {string} sessionId - Session ID
     * @param {object} actionData - Action data {type, timestamp, data}
     */
    async recordLastAction(sessionId, actionData) {
        try {
            const session = await ChatSession.findOne({ sessionId });
            if (!session) {
                throw new Error("Session not found");
            }

            session.context.lastAction = {
                ...actionData,
                timestamp: new Date(),
            };

            await session.save();
            return session;
        } catch (error) {
            throw new Error(`Failed to record action: ${error.message}`);
        }
    }
}

module.exports = new ContextManager();
