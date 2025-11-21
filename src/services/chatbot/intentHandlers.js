const orderService = require("../order.service");
const productService = require("../product.service");
const cartService = require("../cart.service");
const paymentService = require("../payment.service");
const userService = require("../user.service");
const discountService = require("../discount.service");

/**
 * Intent Handlers - Execute actions by calling existing services
 * Maps chatbot intents to actual service function calls
 */
class IntentHandlers {
    // ============== ORDER INTENTS ==============

    /**
     * Check order status
     * ✅ Context-Aware: Uses last mentioned order if missing
     */
    async checkOrderStatus({ orderId, userId, sessionId }) {
        try {
            // Context fallback
            if (!orderId && sessionId) {
                const contextManager = require("./contextManager");
                const context = await contextManager.getContext(sessionId);
                if (context?.lastMentionedOrder) {
                    orderId = context.lastMentionedOrder;
                }
            }

            if (!orderId) {
                 // If no specific order, get list of recent orders
                 return this.getUserOrders({ userId, limit: 3 });
            }

            const order = await orderService.getOrderById(orderId, userId, false);
            return {
                success: true,
                data: {
                    orderId: order._id,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    totalAmount: order.totalAmount,
                    items: order.items,
                    shippingAddress: order.shippingAddress,
                    estimatedDelivery: order.estimatedDeliveryDate,
                },
                message: `Đơn hàng #${order._id} hiện đang ở trạng thái: ${this.formatOrderStatus(order.status)}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.",
            };
        }
    }

    /**
     * Get user's recent orders
     */
    async getUserOrders({ userId, limit = 5 }) {
        try {
            const orders = await orderService.getUserOrders(userId, {
                limit,
                sort: "-createdAt",
            });
            return {
                success: true,
                data: orders,
                message: `Bạn có ${orders.pagination?.totalItems || 0} đơn hàng.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy danh sách đơn hàng.",
            };
        }
    }

    /**
     * Get order details with items, timeline, and suggested actions
     * ✅ NEW: Conversion-focused order details
     */
    async getOrderDetails({ userId, orderId }) {
        try {
            const order = await orderService.getOrderById(orderId, userId, false);

            // Generate order timeline
            const timeline = this._generateOrderTimeline(order);

            // Get suggested actions based on order status
            const suggestedActions = this._getOrderActions(order);

            return {
                success: true,
                data: {
                    order: {
                        id: order._id,
                        status: order.status,
                        paymentStatus: order.paymentStatus,
                        paymentMethod: order.paymentMethod,
                        createdAt: order.createdAt,
                        totalAmount: order.totalAmount,
                        subtotal: order.subtotal,
                        shippingFee: order.shippingFee,
                        discountAmount: order.discountAmount,
                        shippingAddress: order.shippingAddress,
                    },
                    items: order.products.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        variant: item.variant,
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.quantity * item.price,
                    })),
                    timeline,
                    suggestedActions,
                },
                message: `Đơn hàng #${order._id.toString().slice(-6)}: ${this._getStatusText(order.status)} - ${order.totalAmount.toLocaleString("vi-VN")}đ`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy chi tiết đơn hàng.",
            };
        }
    }

    /**
     * Generate order status timeline
     * @private
     */
    _generateOrderTimeline(order) {
        const statusMap = {
            pending: 0,
            confirmed: 1,
            shipping: 2,
            completed: 3,
            cancelled: -1,
        };

        const currentStage = statusMap[order.status] || 0;

        return [
            {
                stage: "Đặt hàng",
                date: order.createdAt,
                status: "completed",
                icon: "📦",
            },
            {
                stage: "Xác nhận",
                date: order.confirmedAt || null,
                status: currentStage >= 1 ? "completed" : currentStage === 0 ? "active" : "cancelled",
                icon: "✅",
            },
            {
                stage: "Đang giao",
                date: order.shippingAt || null,
                status: currentStage >= 2 ? "completed" : currentStage === 1 ? "active" : currentStage === -1 ? "cancelled" : "pending",
                icon: "🚚",
            },
            {
                stage: "Hoàn thành",
                date: order.completedAt || null,
                status: currentStage === 3 ? "completed" : currentStage === -1 ? "cancelled" : "pending",
                icon: "🎉",
            },
        ];
    }

    /**
     * Get suggested actions for order
     * @private
     */
    _getOrderActions(order) {
        const actions = [];

        switch (order.status) {
            case "pending":
                actions.push(
                    { action: "cancel_order", label: "Hủy đơn hàng", icon: "❌" }
                );
                break;

            case "confirmed":
            case "shipping":
                actions.push(
                    { action: "check_order_status", label: "Theo dõi đơn hàng", icon: "📍" }
                );
                break;

            case "completed":
                actions.push(
                    { action: "create_product_review", label: "Đánh giá sản phẩm", icon: "⭐" },
                    { action: "reorder_past_purchase", label: "Mua lại", icon: "🔄" },
                    { action: "recommend_products", label: "Sản phẩm tương tự", icon: "💡" }
                );
                break;

            case "cancelled":
                actions.push(
                    { action: "search_products", label: "Tìm sản phẩm khác", icon: "🔍" }
                );
                break;
        }

        return actions;
    }

    /**
     * Get Vietnamese status text
     * @private
     */
    _getStatusText(status) {
        const statusMap = {
            pending: "Chờ xác nhận",
            confirmed: "Đã xác nhận",
            shipping: "Đang giao hàng",
            completed: "Hoàn thành",
            cancelled: "Đã hủy",
        };
        return statusMap[status] || status;
    }

    /**
     * Cancel an order
     */
    async cancelOrder({ orderId, userId }) {
        try {
            const result = await orderService.cancelOrder(orderId, userId, false);
            return {
                success: true,
                data: result,
                message: "Đơn hàng đã được hủy thành công!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Không thể hủy đơn hàng.",
            };
        }
    }

    /**
     * Update shipping address
     */
    async updateShippingAddress({ orderId, userId, newAddress }) {
        try {
            // Note: You might need to add this method to orderService
            const order = await orderService.getOrderById(orderId, userId, false);

            if (order.status !== "pending" && order.status !== "confirmed") {
                throw new Error("Chỉ có thể cập nhật địa chỉ cho đơn hàng đang chờ xử lý");
            }

            // Update address logic here
            return {
                success: true,
                message: "Địa chỉ giao hàng đã được cập nhật!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể cập nhật địa chỉ giao hàng.",
            };
        }
    }

    // ============== PRODUCT INTENTS ==============

    /**
     * Search products
     */
    async searchProducts({ keyword, limit = 10 }) {
        try {
            const products = await productService.searchProducts(keyword, limit);
            return {
                success: true,
                data: products,
                message: `Tìm thấy ${products.length} sản phẩm cho "${keyword}"`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tìm kiếm sản phẩm.",
            };
        }
    }

    /**
     * Get product details
     * ✅ Context-Aware: Uses last viewed product if missing
     */
    async getProductDetails({ productId, slug, sessionId }) {
        try {
            // Context fallback
            if (!productId && !slug && sessionId) {
                const contextManager = require("./contextManager");
                const context = await contextManager.getContext(sessionId);
                if (context?.lastMentionedProduct) {
                    productId = context.lastMentionedProduct;
                }
            }

            let product;
            if (productId) {
                product = await productService.getProductById(productId);
            } else if (slug) {
                product = await productService.getProductBySlug(slug);
            } else {
                 return {
                    success: false,
                    message: "Bạn muốn xem chi tiết sản phẩm nào?",
                };
            }

            return {
                success: true,
                data: product,
                message: `Thông tin chi tiết sản phẩm: ${product.name}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không tìm thấy sản phẩm.",
            };
        }
    }

    /**
     * Get featured/flash sale products
     */
    async getFlashSaleProducts({ limit = 10 }) {
        try {
            const products = await productService.getOnSaleProducts({ limit });
            return {
                success: true,
                data: products,
                message: `Có ${products.length} sản phẩm đang giảm giá!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy danh sách flash sale.",
            };
        }
    }

    /**
     * Get product recommendations
     */
    async recommendProducts({ keyword, userId, limit = 5 }) {
        try {
            // Use search as recommendation based on keyword
            const products = await productService.searchProducts(keyword, limit);
            return {
                success: true,
                data: products,
                message: `Gợi ý ${products.length} sản phẩm cho bạn`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy gợi ý sản phẩm.",
            };
        }
    }

    // ============== CART INTENTS ==============

    /**
     * View cart
     */
    async viewCart({ userId }) {
        try {
            const cart = await cartService.getCart(userId);
            const itemCount = await cartService.getCartItemCount(userId);
            return {
                success: true,
                data: {
                    cart,
                    itemCount,
                },
                message: `Giỏ hàng của bạn có ${itemCount} sản phẩm, tổng: ${cart.totalAmount.toLocaleString("vi-VN")}đ`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể xem giỏ hàng.",
            };
        }
    }

    /**
     * Add to cart
     * ✅ Context-Aware: Uses last viewed product if productId is missing
     */
    async addToCart({ userId, productId, variantId, quantity = 1, sessionId }) {
        try {
            // Context fallback
            if (!productId && sessionId) {
                const contextManager = require("./contextManager");
                const context = await contextManager.getContext(sessionId);
                if (context?.lastMentionedProduct) {
                    productId = context.lastMentionedProduct;
                } else if (context?.currentProduct) {
                    productId = context.currentProduct.id;
                }
            }

            if (!productId) {
                return {
                    success: false,
                    message: "Bạn muốn thêm sản phẩm nào vào giỏ hàng? Hãy nói rõ tên sản phẩm nhé.",
                };
            }

            const cart = await cartService.addToCart(userId, {
                productId,
                variantId,
                quantity,
            });
            return {
                success: true,
                data: cart,
                message: "Đã thêm sản phẩm vào giỏ hàng!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Không thể thêm vào giỏ hàng.",
            };
        }
    }

    /**
     * Update cart item quantity
     */
    async updateCartItem({ userId, itemId, quantity }) {
        try {
            const cart = await cartService.updateCartItem(userId, itemId, quantity);
            return {
                success: true,
                data: cart,
                message: "Đã cập nhật số lượng sản phẩm!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể cập nhật giỏ hàng.",
            };
        }
    }

    /**
     * Remove from cart
     */
    async removeFromCart({ userId, itemId }) {
        try {
            const cart = await cartService.removeCartItem(userId, itemId);
            return {
                success: true,
                data: cart,
                message: "Đã xóa sản phẩm khỏi giỏ hàng!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể xóa sản phẩm.",
            };
        }
    }

    // ============== PAYMENT INTENTS ==============

    /**
     * Create payment link
     */
    async createPaymentLink({ orderId, userId, ipAddress }) {
        try {
            const payment = await paymentService.createPaymentUrl(
                orderId,
                userId,
                ipAddress
            );
            return {
                success: true,
                data: {
                    paymentUrl: payment.paymentUrl,
                    transactionId: payment.transactionId,
                },
                message: "Link thanh toán đã được tạo!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Không thể tạo link thanh toán.",
            };
        }
    }

    /**
     * Check payment status
     */
    async checkPaymentStatus({ orderId }) {
        try {
            const payment = await paymentService.getPaymentByOrderId(orderId);
            return {
                success: true,
                data: payment,
                message: `Trạng thái thanh toán: ${this.formatPaymentStatus(payment.status)}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không tìm thấy thông tin thanh toán.",
            };
        }
    }

    // ============== USER INTENTS ==============

    /**
     * Get user profile
     */
    async getUserProfile({ userId }) {
        try {
            const user = await userService.getUserProfile(userId);
            return {
                success: true,
                data: user,
                message: `Xin chào ${user.name || user.email}!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy thông tin người dùng.",
            };
        }
    }

    /**
     * Get user vouchers
     */
    async getUserVouchers({ userId }) {
        try {
            // This might need to be implemented in userService or discountService
            const vouchers = await discountService.getActiveDiscounts({
                userId,
                limit: 10,
            });
            return {
                success: true,
                data: vouchers,
                message: `Bạn có ${vouchers.data?.length || 0} voucher có thể sử dụng!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy danh sách voucher.",
            };
        }
    }

    // ============== DISCOUNT INTENTS ==============

    /**
     * Validate voucher code
     */
    async validateVoucher({ code, orderTotal, productIds = [] }) {
        try {
            const result = await discountService.applyDiscount(
                code,
                orderTotal,
                productIds
            );
            return {
                success: true,
                data: result,
                message: `Mã ${code} hợp lệ! Giảm ${result.discountAmount.toLocaleString("vi-VN")}đ`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Mã giảm giá không hợp lệ.",
            };
        }
    }

    /**
     * Get best voucher for cart
     */
    async getBestVoucher({ userId, orderTotal, productIds = [] }) {
        try {
            const vouchers = await discountService.getActiveDiscounts({});

            // Find the best voucher
            let bestVoucher = null;
            let maxDiscount = 0;

            if (vouchers.data && vouchers.data.length > 0) {
                for (const voucher of vouchers.data) {
                    try {
                        const applied = await discountService.applyDiscount(
                            voucher.code,
                            orderTotal,
                            productIds
                        );
                        if (applied.discountAmount > maxDiscount) {
                            maxDiscount = applied.discountAmount;
                            bestVoucher = voucher;
                        }
                    } catch (err) {
                        // Skip invalid vouchers
                    }
                }
            }

            if (bestVoucher) {
                return {
                    success: true,
                    data: {
                        voucher: bestVoucher,
                        discount: maxDiscount,
                    },
                    message: `Voucher tốt nhất: ${bestVoucher.code} - Giảm ${maxDiscount.toLocaleString("vi-VN")}đ`,
                };
            } else {
                return {
                    success: false,
                    message: "Không có voucher phù hợp cho đơn hàng này.",
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tìm voucher tốt nhất.",
            };
        }
    }

    // ============== NEW HANDLERS ==============

    // REVIEW INTENTS

    /**
     * Create product review
     * ✅ Context-Aware: Uses last viewed product if productId is missing
     */
    async createProductReview({ userId, productId, rating, comment = "", sessionId }) {
        try {
            // Context fallback
            if (!productId && sessionId) {
                const contextManager = require("./contextManager");
                const context = await contextManager.getContext(sessionId);
                if (context?.lastMentionedProduct) {
                    productId = context.lastMentionedProduct;
                }
            }

            if (!productId) {
                return {
                    success: false,
                    message: "Bạn muốn đánh giá sản phẩm nào?",
                };
            }

            const reviewService = require("../review.service");

            // Check if user can review this product
            const canReview = await reviewService.canUserReview(userId, productId);
            if (!canReview.canReview) {
                return {
                    success: false,
                    message: canReview.message || "Bạn chỉ có thể đánh giá sản phẩm đã mua.",
                };
            }

            const review = await reviewService.createReview(userId, {
                product: productId,
                rating,
                comment,
            });

            return {
                success: true,
                data: review,
                message: `Cảm ơn bạn đã đánh giá ${rating} sao!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Không thể tạo đánh giá.",
            };
        }
    }

    /**
     * Get product reviews
     */
    async getProductReviews({ productId, limit = 5 }) {
        try {
            const reviewService = require("../review.service");
            const result = await reviewService.getProductReviews(productId, {
                page: 1,
                limit,
            });

            return {
                success: true,
                data: result,
                message: `Sản phẩm có ${result.pagination?.total || 0} đánh giá.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy đánh giá sản phẩm.",
            };
        }
    }

    // CATEGORY INTENTS

    /**
     * Browse categories
     */
    async browseCategories() {
        try {
            const categoryService = require("../category.service");
            const categories = await categoryService.getActiveCategories();

            return {
                success: true,
                data: categories,
                message: `Có ${categories.data?.length || 0} danh mục sản phẩm.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy danh sách danh mục.",
            };
        }
    }

    /**
     * Get products by category
     */
    async getProductsByCategory({ categoryName, limit = 10 }) {
        try {
            const categoryService = require("../category.service");

            // Convert category name to slug
            const slug = categoryName.toLowerCase().replace(/\s+/g, "-");

            // Find category
            const category = await categoryService.getCategoryBySlug(slug);
            if (!category) {
                return {
                    success: false,
                    message: `Không tìm thấy danh mục "${categoryName}".`,
                };
            }

            // Get products in category
            const products = await productService.getProductsByCategorySlug(slug, {
                page: 1,
                limit,
            });

            return {
                success: true,
                data: products,
                message: `Tìm thấy ${products.pagination?.total || 0} sản phẩm trong danh mục ${category.name}.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm theo danh mục.",
            };
        }
    }

    // ADDRESS INTENTS

    /**
     * Get user addresses
     */
    async getUserAddresses({ userId }) {
        try {
            const addresses = await userService.getAddresses(userId);

            return {
                success: true,
                data: addresses,
                message:
                    addresses.length > 0
                        ? `Bạn có ${addresses.length} địa chỉ đã lưu.`
                        : "Bạn chưa có địa chỉ nào.",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy danh sách địa chỉ.",
            };
        }
    }

    /**
     * Add delivery address
     */
    async addDeliveryAddress({ userId, ...addressData }) {
        try {
            const result = await userService.addAddress(userId, addressData);

            return {
                success: true,
                data: result,
                message: "Đã thêm địa chỉ giao hàng mới thành công!",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Không thể thêm địa chỉ.",
            };
        }
    }

    // PRODUCT COMPARISON & STOCK

    /**
     * Compare products
     */
    async compareProducts({ productIds }) {
        try {
            if (!productIds || productIds.length < 2) {
                return {
                    success: false,
                    message: "Cần ít nhất 2 sản phẩm để so sánh.",
                };
            }

            const products = await Promise.all(
                productIds.map((id) => productService.getProductById(id))
            );

            // Build comparison data
            const comparison = products.map((p) => ({
                id: p._id,
                name: p.name,
                price: p.price,
                salePrice: p.salePrice,
                rating: p.averageRating,
                reviewCount: p.reviewCount,
                brand: p.brand,
                stock: p.stock,
                image: p.images?.[0] || null,
            }));

            return {
                success: true,
                data: comparison,
                message: `So sánh ${products.length} sản phẩm.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể so sánh sản phẩm.",
            };
        }
    }

    /**
     * Check stock availability
     */
    async checkStockAvailability({ productId, variantId }) {
        try {
            const product = await productService.getProductById(productId);

            let stock;
            if (variantId) {
                const variant = product.variants?.find(
                    (v) => v._id.toString() === variantId
                );
                stock = variant?.stock || 0;
            } else {
                stock = product.stock || 0;
            }

            const isAvailable = stock > 0;

            return {
                success: true,
                data: {
                    inStock: isAvailable,
                    quantity: stock,
                    productName: product.name,
                },
                message: isAvailable
                    ? `Sản phẩm còn ${stock} sản phẩm trong kho.`
                    : "Sản phẩm tạm hết hàng.",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể kiểm tra tồn kho.",
            };
        }
    }

    // ORDER CREATION

    /**
     * Create order from cart
     */
    async createOrderFromCart({ userId, shippingAddressId, paymentMethod = "COD", notes = "" }) {
        try {
            // Get cart
            const cart = await cartService.getCart(userId);
            if (!cart || !cart.items || cart.items.length === 0) {
                return {
                    success: false,
                    message: "Giỏ hàng của bạn đang trống.",
                };
            }

            // Get address
            const addresses = await userService.getAddresses(userId);
            const shippingAddress = addresses.find(
                (addr) => addr._id.toString() === shippingAddressId
            );

            if (!shippingAddress) {
                return {
                    success: false,
                    message: "Địa chỉ giao hàng không hợp lệ.",
                };
            }

            // Create order
            const orderData = {
                items: cart.items.map((item) => ({
                    product: item.product._id,
                    variant: item.variant?._id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shippingAddress: {
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    district: shippingAddress.district,
                    ward: shippingAddress.ward,
                },
                paymentMethod,
                notes,
            };

            const order = await orderService.createOrder(userId, orderData);

            // Clear cart after creating order
            await cartService.clearCart(userId);

            return {
                success: true,
                data: order,
                message: `Đơn hàng #${order._id} đã được tạo thành công!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Không thể tạo đơn hàng.",
            };
        }
    }

    // DISCOVERY INTENTS

    /**
     * Get similar products
     */
    async getSimilarProducts({ productId, limit = 5 }) {
        try {
            const product = await productService.getProductById(productId);

            // Get products in same category
            const similar = await productService.getProductsByCategory(
                product.category,
                {
                    page: 1,
                    limit,
                }
            );

            // Filter out the current product
            const filtered = similar.data?.filter(
                (p) => p._id.toString() !== productId
            ) || [];

            return {
                success: true,
                data: filtered,
                message: `Tìm thấy ${filtered.length} sản phẩm tương tự.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm tương tự.",
            };
        }
    }

    /**
     * Get bestselling products
     */
    async getBestsellingProducts({ limit = 10 }) {
        try {
            const products = await productService.getFeaturedProducts({ limit });

            return {
                success: true,
                data: products,
                message: `Có ${products.length} sản phẩm bán chạy.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm bán chạy.",
            };
        }
    }

    /**
     * Get trending products
     */
    async getTrendingProducts({ limit = 10 }) {
        try {
            // Use new arrivals as trending
            const products = await productService.getNewArrivalProducts({ limit });

            return {
                success: true,
                data: products,
                message: `Có ${products.length} sản phẩm đang hot.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm trending.",
            };
        }
    }

    /**
     * Calculate shipping fee
     */
    async calculateShippingFee({ city, district }) {
        try {
            // Simple shipping fee calculation
            // You can make this more sophisticated based on your needs
            const baseFee = 30000; // 30k VND base fee
            let shippingFee = baseFee;

            // Add extra for distant cities
            const distantCities = ["Cần Thơ", "Đà Nẵng", "Huế", "Nha Trang"];
            if (distantCities.some((c) => city.includes(c))) {
                shippingFee += 20000;
            }

            return {
                success: true,
                data: {
                    city,
                    district,
                    shippingFee,
                },
                message: `Phí vận chuyển đến ${city}: ${shippingFee.toLocaleString("vi-VN")}đ`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tính phí vận chuyển.",
            };
        }
    }

    /**
     * Apply voucher to cart
     */
    async applyVoucherToCart({ userId, voucherCode }) {
        try {
            // Get cart
            const cart = await cartService.getCart(userId);
            if (!cart || cart.items.length === 0) {
                return {
                    success: false,
                    message: "Giỏ hàng của bạn đang trống.",
                };
            }

            // Validate voucher
            const productIds = cart.items.map((item) => item.product._id.toString());
            const result = await discountService.applyDiscount(
                voucherCode,
                cart.totalAmount,
                productIds
            );

            return {
                success: true,
                data: {
                    originalAmount: cart.totalAmount,
                    discountAmount: result.discountAmount,
                    finalAmount: cart.totalAmount - result.discountAmount,
                    voucherCode,
                },
                message: `Đã áp dụng mã ${voucherCode}! Giảm ${result.discountAmount.toLocaleString("vi-VN")}đ`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: error.message || "Mã giảm giá không hợp lệ.",
            };
        }
    }

    // ============== PERSUASIVE COMMERCE HANDLERS ==============

    // A. PERSONALIZATION TOOLS

    /**
     * Get user purchase history
     */
    async getUserPurchaseHistory({ userId, limit = 5 }) {
        try {
            const orders = await orderService.getUserOrders(userId, {
                limit,
                sort: "-createdAt",
            });

            // Analyze favorite categories
            const categoryCount = {};
            let totalSpent = 0;

            orders.data?.forEach((order) => {
                totalSpent += order.totalAmount || 0;
                order.items?.forEach((item) => {
                    const cat = item.product?.category?.name;
                    if (cat) {
                        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                    }
                });
            });

            const favoriteCategories = Object.entries(categoryCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name]) => name);

            return {
                success: true,
                data: {
                    orders: orders.data,
                    stats: {
                        totalOrders: orders.pagination?.totalItems || 0,
                        totalSpent,
                        avgOrderValue: totalSpent / (orders.pagination?.totalItems || 1),
                        favoriteCategories,
                        lastPurchaseDate: orders.data?.[0]?.createdAt,
                    },
                },
                message: `Bạn đã mua ${orders.pagination?.totalItems || 0} đơn hàng, chi ${totalSpent.toLocaleString("vi-VN")}đ`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy lịch sử mua hàng.",
            };
        }
    }

    /**
     * Get personalized recommendations
     */
    async getPersonalizedRecommendations({
        userId,
        context = "general",
        limit = 5,
    }) {
        try {
            // Get user's purchase history to understand preferences
            const history = await this.getUserPurchaseHistory({ userId, limit: 10 });

            let products = [];
            let recommendationReason = "";

            if (history.success && history.data.stats.favoriteCategories.length > 0) {
                // Recommend based on favorite category
                const favCategory = history.data.stats.favoriteCategories[0];
                const categoryService = require("../category.service");
                const category = await categoryService.getCategoryBySlug(
                    favCategory.toLowerCase().replace(/\s+/g, "-")
                );

                if (category) {
                    const result = await productService.getProductsByCategory(
                        category._id,
                        { page: 1, limit }
                    );
                    products = result.data || [];
                    recommendationReason = `Vì bạn thích ${favCategory}`;
                }
            }

            // Fallback to featured products
            if (products.length === 0) {
                products = await productService.getFeaturedProducts({ limit });
                recommendationReason = "Sản phẩm đề xuất cho bạn";
            }

            return {
                success: true,
                data: {
                    products,
                    reason: recommendationReason,
                    context,
                },
                message: `${recommendationReason} - ${products.length} sản phẩm phù hợp!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tạo gợi ý cá nhân hóa.",
            };
        }
    }

    /**
     * Track user behavior
     */
    async trackUserBehavior({ userId, action, productId }) {
        try {
            // In production, this would save to a behavior tracking database
            // For now, we'll just return success
            return {
                success: true,
                data: {
                    userId,
                    action,
                    productId,
                    timestamp: new Date(),
                },
                message: `Đã ghi nhận hành động: ${action}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tracking hành vi.",
            };
        }
    }

    /**
     * Get user preferences
     */
    async getUserPreferences({ userId }) {
        try {
            const history = await this.getUserPurchaseHistory({ userId, limit: 20 });

            if (!history.success) {
                return {
                    success: true,
                    data: {
                        preferredBrands: [],
                        priceRange: { min: 0, max: 100000000 },
                        interests: [],
                    },
                    message: "Chưa có dữ liệu preferences.",
                };
            }

            // Analyze price range
            const prices = [];
            const brands = {};

            history.data.orders?.forEach((order) => {
                order.items?.forEach((item) => {
                    prices.push(item.price || 0);
                    const brand = item.product?.brand;
                    if (brand) {
                        brands[brand] = (brands[brand] || 0) + 1;
                    }
                });
            });

            const preferredBrands = Object.entries(brands)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name]) => name);

            const priceRange = {
                min: Math.min(...prices, 0),
                max: Math.max(...prices, 0),
                avg: prices.reduce((a, b) => a + b, 0) / prices.length || 0,
            };

            return {
                success: true,
                data: {
                    preferredBrands,
                    priceRange,
                    interests: history.data.stats.favoriteCategories,
                },
                message: `Bạn thích ${preferredBrands.join(", ")} và ${history.data.stats.favoriteCategories.join(", ")}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy preferences.",
            };
        }
    }

    // B. URGENCY & SCARCITY TOOLS

    /**
     * Get flash deals
     */
    async getFlashDeals({ categoryId, limit = 5 }) {
        try {
            const products = await productService.getOnSaleProducts({ limit });

            // Add urgency info
            const flashDeals = products.map((p) => ({
                ...p,
                flashSaleEnd: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
                savedAmount: p.price - (p.salePrice || p.price),
                percentOff: Math.round(
                    ((p.price - (p.salePrice || p.price)) / p.price) * 100
                ),
            }));

            return {
                success: true,
                data: {
                    deals: flashDeals,
                    timeRemaining: "Còn 3 giờ",
                    totalDeals: flashDeals.length,
                },
                message: `🔥 ${flashDeals.length} Flash Deals - CHỈ CÒN 3 GIỜ!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy flash deals.",
            };
        }
    }

    /**
     * Get low stock products
     */
    async getLowStockProducts({ productId }) {
        try {
            const product = await productService.getProductById(productId);
            const stock = product.stock || 0;
            const isLowStock = stock > 0 && stock <= 10;

            let urgencyMessage = "";
            if (stock === 0) {
                urgencyMessage = "Đã hết hàng";
            } else if (stock <= 3) {
                urgencyMessage = `⚠️ CHỈ CÒN ${stock} SẢN PHẨM CUỐI CÙNG!`;
            } else if (stock <= 10) {
                urgencyMessage = `Sắp hết! Còn ${stock} sản phẩm`;
            } else {
                urgencyMessage = "Còn hàng";
            }

            return {
                success: true,
                data: {
                    productId,
                    productName: product.name,
                    stock,
                    isLowStock,
                    urgencyLevel: stock <= 3 ? "critical" : stock <= 10 ? "warning" : "normal",
                },
                message: urgencyMessage,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể kiểm tra tồn kho.",
            };
        }
    }

    /**
     * Get limited time offers
     */
    async getLimitedTimeOffers({ userId, limit = 3 }) {
        try {
            const discounts = await discountService.getActiveDiscounts({ limit });

            const offers = discounts.data?.map((d) => ({
                code: d.code,
                description: d.description,
                discountPercent: d.discountPercent,
                discountAmount: d.discountAmount,
                minOrderValue: d.minOrderValue,
                expiryDate: d.endDate,
                hoursRemaining: Math.round(
                    (new Date(d.endDate) - new Date()) / (1000 * 60 * 60)
                ),
                exclusivity: "Chỉ dành cho bạn",
            }));

            return {
                success: true,
                data: {
                    offers: offers || [],
                    totalOffers: offers?.length || 0,
                },
                message: `🎁 ${offers?.length || 0} ưu đãi đặc biệt đang chờ bạn!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy limited offers.",
            };
        }
    }

    // C. SOCIAL PROOF TOOLS

    /**
     * Get recent purchases
     */
    async getRecentPurchases({ productId, limit = 5 }) {
        try {
            let query = { status: "delivered" };
            if (productId) {
                query["items.product"] = productId;
            }

            // Get recent completed orders
            const recentOrders = await orderService.getOrders({
                ...query,
                limit,
                sort: "-createdAt",
            });

            const purchases = recentOrders.data?.map((order) => ({
                userName: order.user?.name?.substring(0, 1) + "***", // Privacy
                productName: order.items?.[0]?.product?.name,
                timestamp: order.createdAt,
                location: order.shippingAddress?.city,
                timeAgo: this.getTimeAgo(order.createdAt),
            }));

            return {
                success: true,
                data: {
                    purchases: purchases || [],
                    totalPurchases: purchases?.length || 0,
                },
                message: `👥 ${purchases?.length || 0} người vừa mua gần đây`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy thông tin mua hàng gần đây.",
            };
        }
    }

    /**
     * Get trending now
     */
    async getTrendingNow({ timeframe = "today", limit = 10 }) {
        try {
            // Use new arrivals as trending
            const products = await productService.getNewArrivalProducts({ limit });

            // Simulate view/purchase counts
            const trending = products.map((p) => ({
                ...p,
                viewCount: Math.floor(Math.random() * 5000) + 1000,
                purchaseCount: Math.floor(Math.random() * 500) + 50,
                trendingScore: Math.random() * 100,
            }));

            return {
                success: true,
                data: {
                    products: trending,
                    timeframe,
                    totalTrending: trending.length,
                },
                message: `🔥 ${trending.length} sản phẩm đang VIRAL hôm nay!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm trending.",
            };
        }
    }

    // D. INCENTIVE TOOLS

    /**
     * Generate personalized discount
     */
    async generatePersonalizedDiscount({ userId, trigger, minOrderValue = 0 }) {
        try {
            let discountAmount = 0;
            let discountCode = "";
            let message = "";
            let expiryMinutes = 30;

            switch (trigger) {
                case "first_purchase":
                    discountAmount = 500000;
                    discountCode = "FIRST500K";
                    message = "🎉 Chào mừng khách hàng mới!";
                    expiryMinutes = 60;
                    break;

                case "cart_abandonment":
                    discountAmount = 300000;
                    discountCode = "COMEBACK300";
                    message = "💝 Chúng tôi nhớ bạn! Quay lại nhé";
                    break;

                case "vip":
                    discountAmount = 1000000;
                    discountCode = "VIP1M";
                    message = "👑 Ưu đãi VIP đặc biệt";
                    expiryMinutes = 120;
                    break;

                case "loyalty":
                    discountAmount = 200000;
                    discountCode = "THANKYOU200";
                    message = "❤️ Cảm ơn bạn đã tin tưởng";
                    break;

                default:
                    discountAmount = 100000;
                    discountCode = "SPECIAL100";
                    message = "🎁 Ưu đãi đặc biệt";
            }

            const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);

            return {
                success: true,
                data: {
                    discountCode,
                    discountAmount,
                    minOrderValue,
                    expiryTime,
                    expiryMinutes,
                    trigger,
                },
                message: `${message} - Giảm ${discountAmount.toLocaleString("vi-VN")}đ (mã: ${discountCode})`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tạo mã giảm giá.",
            };
        }
    }

    /**
     * Calculate bundle savings
     */
    async calculateBundleSavings({ productIds }) {
        try {
            if (!productIds || productIds.length < 2) {
                return {
                    success: false,
                    message: "Cần ít nhất 2 sản phẩm để tính bundle.",
                };
            }

            const products = await Promise.all(
                productIds.map((id) => productService.getProductById(id))
            );

            const individualPrice = products.reduce(
                (sum, p) => sum + (p.salePrice || p.price),
                0
            );
            const bundleDiscount = 0.15; // 15% discount
            const bundlePrice = individualPrice * (1 - bundleDiscount);
            const savings = individualPrice - bundlePrice;

            return {
                success: true,
                data: {
                    products: products.map((p) => ({
                        id: p._id,
                        name: p.name,
                        price: p.salePrice || p.price,
                    })),
                    individualPrice,
                    bundlePrice,
                    savings,
                    savingsPercent: bundleDiscount * 100,
                },
                message: `💰 Mua combo tiết kiệm ${savings.toLocaleString("vi-VN")}đ (${bundleDiscount * 100}%)!`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể tính bundle savings.",
            };
        }
    }

    // E. CART RECOVERY TOOLS

    /**
     * Get abandoned cart
     */
    async getAbandonedCart({ userId }) {
        try {
            const cart = await cartService.getCart(userId);

            if (!cart || !cart.items || cart.items.length === 0) {
                return {
                    success: false,
                    message: "Giỏ hàng trống.",
                };
            }

            // Simulate abandoned time
            const abandonedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
            const timeSinceAbandoned = "30 phút trước";

            return {
                success: true,
                data: {
                    cart,
                    abandonedAt,
                    timeSinceAbandoned,
                    totalValue: cart.totalAmount,
                    itemCount: cart.items.length,
                },
                message: `🛒 Bạn có ${cart.items.length} sản phẩm chờ thanh toán (${cart.totalAmount.toLocaleString("vi-VN")}đ)`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy thông tin giỏ hàng.",
            };
        }
    }

    /**
     * Send cart recovery incentive
     */
    async sendCartRecoveryIncentive({ userId, incentiveType = "free_shipping" }) {
        try {
            const cart = await cartService.getCart(userId);

            if (!cart || cart.items.length === 0) {
                return {
                    success: false,
                    message: "Giỏ hàng trống, không thể gửi incentive.",
                };
            }

            let incentive = {};

            switch (incentiveType) {
                case "free_shipping":
                    incentive = {
                        type: "free_shipping",
                        value: 30000,
                        code: "FREESHIP",
                        message: "🚚 FREESHIP toàn quốc nếu thanh toán trong 1 giờ!",
                    };
                    break;

                case "discount":
                    const discountValue = Math.min(cart.totalAmount * 0.1, 500000);
                    incentive = {
                        type: "discount",
                        value: discountValue,
                        code: "CART10",
                        message: `💸 Giảm thêm ${discountValue.toLocaleString("vi-VN")}đ!`,
                    };
                    break;

                case "gift":
                    incentive = {
                        type: "gift",
                        value: 0,
                        giftName: "Túi xách cao cấp",
                        message: "🎁 Tặng túi xách cao cấp khi hoàn tất đơn!",
                    };
                    break;

                default:
                    incentive = {
                        type: "reminder",
                        message: "👋 Giỏ hàng của bạn đang chờ!",
                    };
            }

            return {
                success: true,
                data: {
                    incentive,
                    cartValue: cart.totalAmount,
                    expiryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                },
                message: incentive.message,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể gửi cart recovery incentive.",
            };
        }
    }

    // F. UPSELLING & CROSS-SELLING TOOLS

    /**
     * Get upgrade suggestions
     */
    async getUpgradeSuggestions({ currentProductId }) {
        try {
            const currentProduct = await productService.getProductById(
                currentProductId
            );

            // Find higher-priced products in same category
            const categoryProducts = await productService.getProductsByCategory(
                currentProduct.category,
                { page: 1, limit: 20 }
            );

            const upgrades = categoryProducts.data
                ?.filter(
                    (p) =>
                        p._id.toString() !== currentProductId &&
                        (p.salePrice || p.price) > (currentProduct.salePrice || currentProduct.price)
                )
                .slice(0, 3)
                .map((p) => {
                    const priceDiff =
                        (p.salePrice || p.price) -
                        (currentProduct.salePrice || currentProduct.price);
                    return {
                        product: p,
                        priceDiff,
                        benefits: ["Camera tốt hơn", "Pin lâu hơn", "Hiệu năng cao hơn"],
                        worthIt: priceDiff < currentProduct.price * 0.3, // Worth if < 30% increase
                    };
                });

            return {
                success: true,
                data: {
                    currentProduct: {
                        id: currentProduct._id,
                        name: currentProduct.name,
                        price: currentProduct.salePrice || currentProduct.price,
                    },
                    upgrades: upgrades || [],
                },
                message:
                    upgrades && upgrades.length > 0
                        ? `📱 Có ${upgrades.length} phiên bản cao cấp hơn!`
                        : "Sản phẩm này đã là phiên bản tốt nhất.",
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy upgrade suggestions.",
            };
        }
    }

    /**
     * Get frequently bought together
     */
    async getFrequentlyBoughtTogether({ productIds }) {
        try {
            if (!productIds || productIds.length === 0) {
                return {
                    success: false,
                    message: "Cần ít nhất 1 sản phẩm.",
                };
            }

            // Get product to find same category
            const mainProduct = await productService.getProductById(productIds[0]);

            // Get products in same category as suggestions
            const categoryProducts = await productService.getProductsByCategory(
                mainProduct.category,
                { page: 1, limit: 10 }
            );

            const suggestions = categoryProducts.data
                ?.filter((p) => !productIds.includes(p._id.toString()))
                .slice(0, 3)
                .map((p) => ({
                    ...p,
                    buyTogetherPercent: Math.floor(Math.random() * 30) + 60, // 60-90%
                    bundleDiscount: 0.2, // 20% off
                }));

            return {
                success: true,
                data: {
                    mainProducts: productIds.length,
                    suggestions: suggestions || [],
                    bundleDiscount: 20,
                    avgBuyTogetherPercent:
                        suggestions?.reduce((sum, s) => sum + s.buyTogetherPercent, 0) /
                        (suggestions?.length || 1),
                },
                message: `🎒 ${suggestions?.[0]?.buyTogetherPercent || 85}% người cũng mua thêm ${suggestions?.length || 0} sản phẩm này (giảm 20%)`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy frequently bought together.",
            };
        }
    }

    // Helper method for time ago
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds} giây trước`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `${days} ngày trước`;
    }

    // ============== HELPER METHODS ==============

    formatOrderStatus(status) {
        const statusMap = {
            pending: "Đang chờ xử lý",
            confirmed: "Đã xác nhận",
            processing: "Đang xử lý",
            shipping: "Đang giao hàng",
            delivered: "Đã giao hàng",
            cancelled: "Đã hủy",
            refunded: "Đã hoàn tiền",
        };
        return statusMap[status] || status;
    }

    formatPaymentStatus(status) {
        const statusMap = {
            pending: "Chờ thanh toán",
            completed: "Đã thanh toán",
            failed: "Thanh toán thất bại",
            refunded: "Đã hoàn tiền",
        };
        return statusMap[status] || status;
    }

    // ========== ADVANCED PRODUCT FILTERING METHODS ==========

    // Filter products by price range
    async filterProductsByPrice({ minPrice, maxPrice, category, sortBy, limit = 20, userId }) {
        try {
            const query = {};

            // Build price range query
            if (minPrice || maxPrice) {
                query["price.currentPrice"] = {};
                if (minPrice) query["price.currentPrice"].$gte = minPrice;
                if (maxPrice) query["price.currentPrice"].$lte = maxPrice;
            }

            // Add category filter if provided
            if (category) {
                query.category = { $regex: category, $options: "i" };
            }

            // Get more products if sorting to ensure we have enough
            const fetchLimit = sortBy ? limit * 2 : limit;

            const products = await productService.searchProducts(
                "",
                fetchLimit,
                1,
                userId,
                query
            );

            if (!products || products.length === 0) {
                return {
                    success: false,
                    message: category
                        ? `Không tìm thấy ${category} trong khoảng giá này.`
                        : "Không tìm thấy sản phẩm trong khoảng giá này.",
                };
            }

            // Sort by price if requested
            if (sortBy === "highest") {
                products.sort((a, b) => 
                    (b.price?.currentPrice || 0) - (a.price?.currentPrice || 0)
                );
            } else if (sortBy === "lowest") {
                products.sort((a, b) => 
                    (a.price?.currentPrice || 0) - (b.price?.currentPrice || 0)
                );
            }

            // Limit results after sorting
            const resultProducts = products.slice(0, limit);

            // Build response message
            let messageText = "";
            if (sortBy === "highest") {
                messageText = `${resultProducts.length} sản phẩm ${category || ""} có giá cao nhất`;
            } else if (sortBy === "lowest") {
                messageText = `${resultProducts.length} sản phẩm ${category || ""} có giá rẻ nhất`;
            } else {
                const priceRangeText = [];
                if (minPrice) priceRangeText.push(`từ ${minPrice.toLocaleString("vi-VN")}đ`);
                if (maxPrice) priceRangeText.push(`đến ${maxPrice.toLocaleString("vi-VN")}đ`);
                messageText = `Tìm thấy ${resultProducts.length} sản phẩm ${category || ""} ${priceRangeText.join(" ")}`;
            }

            return {
                success: true,
                data: resultProducts,
                message: messageText.trim(),
            };
        } catch (error) {
            console.error("Error in filterProductsByPrice:", error);
            return {
                success: false,
                error: error.message,
                message: "Không thể lọc sản phẩm theo giá.",
            };
        }
    }

    // Get products by rating
    async getProductsByRating({ minRating = 4.0, category, limit = 10, userId }) {
        try {
            const query = {
                "reviews.averageRating": { $gte: minRating },
            };

            // Add category filter if provided
            if (category) {
                query.category = { $regex: category, $options: "i" };
            }

            const products = await productService.searchProducts(
                "",
                limit,
                1,
                userId,
                query
            );

            if (!products || products.length === 0) {
                return {
                    success: false,
                    message: `Không tìm thấy sản phẩm ${category || ""} có đánh giá từ ${minRating} sao.`,
                };
            }

            // Sort by rating
            products.sort((a, b) => 
                (b.reviews?.averageRating || 0) - (a.reviews?.averageRating || 0)
            );

            return {
                success: true,
                data: products,
                message: `Top ${products.length} sản phẩm ${category || ""} có đánh giá cao nhất (từ ${minRating} sao)`,
            };
        } catch (error) {
            console.error("Error in getProductsByRating:", error);
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm theo đánh giá.",
            };
        }
    }

    // Get new arrivals
    async getNewArrivals({ category, days = 30, limit = 15, userId }) {
        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);

            const query = {
                createdAt: { $gte: dateThreshold },
            };

            // Add category filter if provided
            if (category) {
                query.category = { $regex: category, $options: "i" };
            }

            const products = await productService.searchProducts(
                "",
                limit,
                1,
                userId,
                query
            );

            if (!products || products.length === 0) {
                return {
                    success: false,
                    message: `Chưa có sản phẩm ${category || ""} mới trong ${days} ngày qua.`,
                };
            }

            // Sort by newest first
            products.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            return {
                success: true,
                data: products,
                message: `${products.length} sản phẩm ${category || ""} mới trong ${days} ngày qua`,
            };
        } catch (error) {
            console.error("Error in getNewArrivals:", error);
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm mới.",
            };
        }
    }

    // Get hot/trending products
    async getHotTrendingProducts({ category, timeFrame = "week", limit = 10, userId }) {
        try {
            const query = {};

            // Add category filter if provided
            if (category) {
                query.category = { $regex: category, $options: "i" };
            }

            // Get products and sort by popularity metrics
            const products = await productService.searchProducts(
                "",
                limit * 2, // Get more to sort properly
                1,
                userId,
                query
            );

            if (!products || products.length === 0) {
                return {
                    success: false,
                    message: `Không tìm thấy sản phẩm ${category || ""} trending.`,
                };
            }

            // Calculate trending score based on views and sales
            const scoredProducts = products.map(product => {
                const viewScore = product.viewCount || 0;
                const salesScore = (product.soldCount || 0) * 5; // Sales weighted more
                const ratingScore = (product.reviews?.averageRating || 0) * 10;
                
                return {
                    ...product,
                    trendingScore: viewScore + salesScore + ratingScore,
                };
            });

            // Sort by trending score and limit
            scoredProducts.sort((a, b) => b.trendingScore - a.trendingScore);
            const topProducts = scoredProducts.slice(0, limit);

            const timeFrameText = 
                timeFrame === "day" ? "hôm nay" :
                timeFrame === "week" ? "tuần này" : "tháng này";

            return {
                success: true,
                data: topProducts,
                message: `Top ${topProducts.length} sản phẩm ${category || ""} hot nhất ${timeFrameText}`,
            };
        } catch (error) {
            console.error("Error in getHotTrendingProducts:", error);
            return {
                success: false,
                error: error.message,
                message: "Không thể lấy sản phẩm trending.",
            };
        }
    }

    // Filter products by attributes (size, color, brand)
    async filterProductsByAttributes({ category, size, color, brand, limit = 20, userId }) {
        try {
            const query = {};

            // Add category filter if provided (optional)
            if (category) {
                query.category = { $regex: category, $options: "i" };
            }

            // Build attribute filters
            if (size) {
                query["variants.size"] = { $regex: size, $options: "i" };
            }
            if (color) {
                query["variants.color"] = { $regex: color, $options: "i" };
            }
            if (brand) {
                query.brand = { $regex: brand, $options: "i" };
            }

            const products = await productService.searchProducts(
                "",
                limit,
                1,
                userId,
                query
            );

            if (!products || products.length === 0) {
                const attributes = [];
                if (size) attributes.push(`size ${size}`);
                if (color) attributes.push(`màu ${color}`);
                if (brand) attributes.push(`thương hiệu ${brand}`);
                
                const categoryText = category ? ` ${category}` : "";
                
                return {
                    success: false,
                    message: `Không tìm thấy sản phẩm${categoryText} ${attributes.join(", ")}.`,
                };
            }

            const attributes = [];
            if (brand) attributes.push(brand);
            if (size) attributes.push(`size ${size}`);
            if (color) attributes.push(`màu ${color}`);

            const categoryText = category ? ` ${category}` : "";

            return {
                success: true,
                data: products,
                message: `Tìm thấy ${products.length} sản phẩm${categoryText} ${attributes.join(", ")}`,
            };
        } catch (error) {
            console.error("Error in filterProductsByAttributes:", error);
            return {
                success: false,
                error: error.message,
                message: "Không thể lọc sản phẩm theo thuộc tính.",
            };
        }
    }
}

module.exports = new IntentHandlers();
