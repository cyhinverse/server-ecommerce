/**
 * Function Declarations for Gemini AI
 * These define all available chatbot functions that the AI can call
 */

const functionDeclarations = [
    // Product Search & Discovery
    {
        name: "search_products",
        description: "Tìm kiếm sản phẩm theo từ khóa, hỗ trợ lọc theo danh mục và giá",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Từ khóa tìm kiếm",
                },
                category: {
                    type: "string",
                    description: "Danh mục sản phẩm (optional)",
                },
                minPrice: {
                    type: "number",
                    description: "Giá tối thiểu",
                },
                maxPrice: {
                    type: "number",
                    description: "Giá tối đa",
                },
                limit: {
                    type: "number",
                    description: "Số lượng kết quả",
                },
            },
        },
    },
    {
        name: "get_product_details",
        description: "Lấy thông tin chi tiết sản phẩm",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm",
                },
            },
            required: ["productId"],
        },
    },
    {
        name: "browse_categories",
        description: "Xem danh sách danh mục sản phẩm",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_products_by_category",
        description: "Lấy sản phẩm theo danh mục",
        parameters: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Tên hoặc ID danh mục",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
            required: ["category"],
        },
    },

    // Cart Operations
    {
        name: "add_to_cart",
        description: "Thêm sản phẩm vào giỏ hàng. Nếu người dùng đề cập đến 'sản phẩm này', 'cái đó', 'món này' hoặc tương tự, hãy sử dụng productId từ sản phẩm vừa được hiển thị trong cuộc hội thoại.",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm cần thêm",
                },
                quantity: {
                    type: "number",
                    description: "Số lượng",
                },
                variantId: {
                    type: "string",
                    description: "ID biến thể (nếu có)",
                },
            },
            required: ["productId"],
        },
    },
    {
        name: "view_cart",
        description: "Xem giỏ hàng hiện tại",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "remove_from_cart",
        description: "Xóa sản phẩm khỏi giỏ hàng",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm cần xóa",
                },
            },
            required: ["productId"],
        },
    },
    {
        name: "update_cart_item",
        description: "Cập nhật số lượng sản phẩm trong giỏ",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm",
                },
                quantity: {
                    type: "number",
                    description: "Số lượng mới",
                },
            },
            required: ["productId", "quantity"],
        },
    },

    // Order Management
    {
        name: "get_user_orders",
        description: "Lấy danh sách đơn hàng của người dùng",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng đơn hàng",
                },
            },
        },
    },
    {
        name: "get_order_details",
        description: "Xem chi tiết đơn hàng với timeline trạng thái và các hành động gợi ý",
        parameters: {
            type: "object",
            properties: {
                orderId: {
                    type: "string",
                    description: "ID đơn hàng",
                },
            },
            required: ["orderId"],
        },
    },
    {
        name: "check_order_status",
        description: "Kiểm tra trạng thái đơn hàng",
        parameters: {
            type: "object",
            properties: {
                orderId: {
                    type: "string",
                    description: "ID đơn hàng",
                },
            },
            required: ["orderId"],
        },
    },
    {
        name: "cancel_order",
        description: "Hủy đơn hàng",
        parameters: {
            type: "object",
            properties: {
                orderId: {
                    type: "string",
                    description: "ID đơn hàng cần hủy",
                },
                reason: {
                    type: "string",
                    description: "Lý do hủy đơn",
                },
            },
            required: ["orderId"],
        },
    },
    {
        name: "create_order_from_cart",
        description: "Tạo đơn hàng từ giỏ hàng",
        parameters: {
            type: "object",
            properties: {
                addressId: {
                    type: "string",
                    description: "ID địa chỉ giao hàng",
                },
                paymentMethod: {
                    type: "string",
                    description: "Phương thức thanh toán",
                },
            },
        },
    },

    // Payment
    {
        name: "create_payment_link",
        description: "Tạo link thanh toán cho đơn hàng",
        parameters: {
            type: "object",
            properties: {
                orderId: {
                    type: "string",
                    description: "ID đơn hàng",
                },
            },
            required: ["orderId"],
        },
    },
    {
        name: "check_payment_status",
        description: "Kiểm tra trạng thái thanh toán",
        parameters: {
            type: "object",
            properties: {
                orderId: {
                    type: "string",
                    description: "ID đơn hàng",
                },
            },
            required: ["orderId"],
        },
    },

    // Vouchers
    {
        name: "validate_voucher",
        description: "Kiểm tra mã voucher",
        parameters: {
            type: "object",
            properties: {
                voucherCode: {
                    type: "string",
                    description: "Mã voucher",
                },
            },
            required: ["voucherCode"],
        },
    },
    {
        name: "get_best_voucher",
        description: "Tìm voucher tốt nhất cho giỏ hàng",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_user_vouchers",
        description: "Lấy danh sách voucher của người dùng",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "apply_voucher_to_cart",
        description: "Áp dụng voucher vào giỏ hàng",
        parameters: {
            type: "object",
            properties: {
                voucherCode: {
                    type: "string",
                    description: "Mã voucher",
                },
            },
            required: ["voucherCode"],
        },
    },

    // User Profile & Addresses
    {
        name: "get_user_profile",
        description: "Lấy thông tin profile người dùng",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_user_addresses",
        description: "Lấy danh sách địa chỉ giao hàng",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "add_delivery_address",
        description: "Thêm địa chỉ giao hàng mới",
        parameters: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Tên người nhận",
                },
                phone: {
                    type: "string",
                    description: "Số điện thoại",
                },
                address: {
                    type: "string",
                    description: "Địa chỉ chi tiết",
                },
                province: {
                    type: "string",
                    description: "Tỉnh/Thành phố",
                },
                district: {
                    type: "string",
                    description: "Quận/Huyện",
                },
                ward: {
                    type: "string",
                    description: "Phường/Xã",
                },
            },
            required: ["name", "phone", "address"],
        },
    },

    // Product Recommendations & Discovery
    {
        name: "get_flash_sale_products",
        description: "Lấy sản phẩm đang flash sale",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "recommend_products",
        description: "Gợi ý sản phẩm cho người dùng",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "get_similar_products",
        description: "Lấy sản phẩm tương tự",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm gốc",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
            required: ["productId"],
        },
    },
    {
        name: "get_bestselling_products",
        description: "Lấy sản phẩm bán chạy",
        parameters: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Danh mục (optional)",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "get_trending_products",
        description: "Lấy sản phẩm đang thịnh hành",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "get_new_arrivals",
        description: "Lấy sản phẩm mới về",
        parameters: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Danh mục (optional)",
                },
                days: {
                    type: "number",
                    description: "Số ngày gần đây",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "get_hot_trending_products",
        description: "Lấy sản phẩm hot/trending",
        parameters: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Danh mục (optional)",
                },
                timeFrame: {
                    type: "string",
                    description: "Khung thời gian (day/week/month)",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },

    // Reviews
    {
        name: "create_product_review",
        description: "Tạo đánh giá sản phẩm",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm",
                },
                rating: {
                    type: "number",
                    description: "Điểm đánh giá (1-5)",
                },
                comment: {
                    type: "string",
                    description: "Nội dung đánh giá",
                },
            },
            required: ["productId", "rating"],
        },
    },
    {
        name: "get_product_reviews",
        description: "Xem đánh giá sản phẩm",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm",
                },
                limit: {
                    type: "number",
                    description: "Số lượng đánh giá",
                },
            },
            required: ["productId"],
        },
    },

    // Product Comparison & Filtering
    {
        name: "compare_products",
        description: "So sánh nhiều sản phẩm",
        parameters: {
            type: "object",
            properties: {
                productIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Danh sách ID sản phẩm cần so sánh",
                },
            },
            required: ["productIds"],
        },
    },
    {
        name: "filter_products_by_price",
        description:
            "Lọc sản phẩm theo khoảng giá. Hỗ trợ sắp xếp theo giá cao nhất/thấp nhất.",
        parameters: {
            type: "object",
            properties: {
                minPrice: {
                    type: "number",
                    description: "Giá tối thiểu",
                },
                maxPrice: {
                    type: "number",
                    description: "Giá tối đa",
                },
                category: {
                    type: "string",
                    description: "Danh mục (optional)",
                },
                sortBy: {
                    type: "string",
                    description:
                        "Sắp xếp theo giá: 'highest' (cao nhất) hoặc 'lowest' (thấp nhất)",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "get_products_by_rating",
        description: "Lọc sản phẩm theo đánh giá",
        parameters: {
            type: "object",
            properties: {
                minRating: {
                    type: "number",
                    description: "Điểm đánh giá tối thiểu (1-5)",
                },
                category: {
                    type: "string",
                    description: "Danh mục (optional)",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "filter_products_by_attributes",
        description: "Lọc sản phẩm theo thuộc tính (size, màu, brand)",
        parameters: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Danh mục (optional)",
                },
                size: {
                    type: "string",
                    description: "Kích thước",
                },
                color: {
                    type: "string",
                    description: "Màu sắc",
                },
                brand: {
                    type: "string",
                    description: "Thương hiệu",
                },
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },

    // Stock & Shipping
    {
        name: "check_stock_availability",
        description: "Kiểm tra tồn kho sản phẩm",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string",
                    description: "ID sản phẩm",
                },
                variantId: {
                    type: "string",
                    description: "ID biến thể (nếu có)",
                },
            },
            required: ["productId"],
        },
    },
    {
        name: "calculate_shipping_fee",
        description: "Tính phí vận chuyển",
        parameters: {
            type: "object",
            properties: {
                addressId: {
                    type: "string",
                    description: "ID địa chỉ giao hàng",
                },
            },
        },
    },
    {
        name: "get_low_stock_products",
        description: "Lấy sản phẩm sắp hết hàng",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },

    // Personalization & User Behavior
    {
        name: "get_user_purchase_history",
        description: "Lấy lịch sử mua hàng",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng đơn hàng",
                },
            },
        },
    },
    {
        name: "get_personalized_recommendations",
        description: "Gợi ý sản phẩm cá nhân hóa",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },
    {
        name: "track_user_behavior",
        description: "Theo dõi hành vi người dùng",
        parameters: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    description: "Loại hành động (view/click/add_to_cart)",
                },
                productId: {
                    type: "string",
                    description: "ID sản phẩm (nếu có)",
                },
            },
            required: ["action"],
        },
    },
    {
        name: "get_user_preferences",
        description: "Lấy sở thích người dùng",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_recent_purchases",
        description: "Lấy sản phẩm đã mua gần đây",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },

    // Flash Deals & Promotions
    {
        name: "get_flash_deals",
        description: "Lấy deal flash đang diễn ra",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng deal",
                },
            },
        },
    },
    {
        name: "get_limited_time_offers",
        description: "Lấy ưu đãi có thời hạn",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng ưu đãi",
                },
            },
        },
    },
    {
        name: "get_trending_now",
        description: "Lấy sản phẩm đang trending hiện tại",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Số lượng sản phẩm",
                },
            },
        },
    },

    // Advanced Marketing Features
    {
        name: "generate_personalized_discount",
        description: "Tạo mã giảm giá cá nhân hóa",
        parameters: {
            type: "object",
            properties: {
                targetAmount: {
                    type: "number",
                    description: "Số tiền mục tiêu",
                },
            },
        },
    },
    {
        name: "calculate_bundle_savings",
        description: "Tính tiết kiệm khi mua combo",
        parameters: {
            type: "object",
            properties: {
                productIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Danh sách ID sản phẩm",
                },
            },
            required: ["productIds"],
        },
    },
    {
        name: "get_abandoned_cart",
        description: "Lấy giỏ hàng bị bỏ rơi",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "send_cart_recovery_incentive",
        description: "Gửi ưu đãi khôi phục giỏ hàng",
        parameters: {
            type: "object",
            properties: {
                discountPercent: {
                    type: "number",
                    description: "Phần trăm giảm giá",
                },
            },
        },
    },
    {
        name: "get_upgrade_suggestions",
        description: "Gợi ý nâng cấp sản phẩm",
        parameters: {
            type: "object",
            properties: {
                currentProductId: {
                    type: "string",
                    description: "ID sản phẩm hiện tại",
                },
            },
            required: ["currentProductId"],
        },
    },
    {
        name: "get_frequently_bought_together",
        description: "Lấy sản phẩm thường được mua cùng",
        parameters: {
            type: "object",
            properties: {
                productIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Danh sách ID sản phẩm",
                },
            },
            required: ["productIds"],
        },
    },
];

module.exports = functionDeclarations;
