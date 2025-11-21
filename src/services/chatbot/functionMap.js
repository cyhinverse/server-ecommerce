/**
 * Function Map - Maps function names to their handler implementations
 * This keeps the mapping logic separate from the classifier logic
 */

const intentHandlers = require("./intentHandlers");

/**
 * Create function map with userId and optional ipAddress
 */
function createFunctionMap(userId, ipAddress = null) {
    const enrichedArgs = (args) => ({ ...args, userId });
    
    // Add ipAddress for payment functions
    const paymentArgs = (args) => ({
        ...args,
        userId,
        ipAddress: ipAddress || "127.0.0.1",
    });

    return {
        // Product Search & Discovery
        search_products: (args) => intentHandlers.searchProducts(enrichedArgs(args)),
        get_product_details: (args) => intentHandlers.getProductDetails(enrichedArgs(args)),
        browse_categories: (args) => intentHandlers.browseCategories(enrichedArgs(args)),
        get_products_by_category: (args) => intentHandlers.getProductsByCategory(enrichedArgs(args)),

        // Cart Operations
        add_to_cart: (args) => intentHandlers.addToCart(enrichedArgs(args)),
        view_cart: (args) => intentHandlers.viewCart(enrichedArgs(args)),
        remove_from_cart: (args) => intentHandlers.removeFromCart(enrichedArgs(args)),
        update_cart_item: (args) => intentHandlers.updateCartItem(enrichedArgs(args)),

        // Order Management
        get_user_orders: (args) => intentHandlers.getUserOrders(enrichedArgs(args)),
        get_order_details: (args) => intentHandlers.getOrderDetails(enrichedArgs(args)), // ✅ NEW: Conversion-focused order details
        check_order_status: (args) => intentHandlers.checkOrderStatus(enrichedArgs(args)),
        cancel_order: (args) => intentHandlers.cancelOrder(enrichedArgs(args)),
        create_order_from_cart: (args) => intentHandlers.createOrderFromCart(enrichedArgs(args)),

        // Payment
        create_payment_link: (args) => intentHandlers.createPaymentLink(paymentArgs(args)),
        check_payment_status: (args) => intentHandlers.checkPaymentStatus(enrichedArgs(args)),

        // Vouchers
        validate_voucher: (args) => intentHandlers.validateVoucher(enrichedArgs(args)),
        get_best_voucher: (args) => intentHandlers.getBestVoucher(enrichedArgs(args)),
        get_user_vouchers: (args) => intentHandlers.getUserVouchers(enrichedArgs(args)),
        apply_voucher_to_cart: (args) => intentHandlers.applyVoucherToCart(enrichedArgs(args)),

        // User Profile & Addresses
        get_user_profile: (args) => intentHandlers.getUserProfile(enrichedArgs(args)),
        get_user_addresses: (args) => intentHandlers.getUserAddresses(enrichedArgs(args)),
        add_delivery_address: (args) => intentHandlers.addDeliveryAddress(enrichedArgs(args)),

        // Product Recommendations & Discovery
        get_flash_sale_products: (args) => intentHandlers.getFlashSaleProducts(enrichedArgs(args)),
        recommend_products: (args) => intentHandlers.recommendProducts(enrichedArgs(args)),
        get_similar_products: (args) => intentHandlers.getSimilarProducts(enrichedArgs(args)),
        get_bestselling_products: (args) => intentHandlers.getBestsellingProducts(enrichedArgs(args)),
        get_trending_products: (args) => intentHandlers.getTrendingProducts(enrichedArgs(args)),
        get_new_arrivals: (args) => intentHandlers.getNewArrivals(enrichedArgs(args)),
        get_hot_trending_products: (args) => intentHandlers.getHotTrendingProducts(enrichedArgs(args)),

        // Reviews
        create_product_review: (args) => intentHandlers.createProductReview(enrichedArgs(args)),
        get_product_reviews: (args) => intentHandlers.getProductReviews(enrichedArgs(args)),

        // Product Comparison & Filtering
        compare_products: (args) => intentHandlers.compareProducts(enrichedArgs(args)),
        filter_products_by_price: (args) => intentHandlers.filterProductsByPrice(enrichedArgs(args)),
        get_products_by_rating: (args) => intentHandlers.getProductsByRating(enrichedArgs(args)),
        filter_products_by_attributes: (args) => intentHandlers.filterProductsByAttributes(enrichedArgs(args)),

        // Stock & Shipping
        check_stock_availability: (args) => intentHandlers.checkStockAvailability(enrichedArgs(args)),
        calculate_shipping_fee: (args) => intentHandlers.calculateShippingFee(enrichedArgs(args)),
        get_low_stock_products: (args) => intentHandlers.getLowStockProducts(enrichedArgs(args)),

        // Personalization & User Behavior
        get_user_purchase_history: (args) => intentHandlers.getUserPurchaseHistory(enrichedArgs(args)),
        get_personalized_recommendations: (args) => intentHandlers.getPersonalizedRecommendations(enrichedArgs(args)),
        track_user_behavior: (args) => intentHandlers.trackUserBehavior(enrichedArgs(args)),
        get_user_preferences: (args) => intentHandlers.getUserPreferences(enrichedArgs(args)),
        get_recent_purchases: (args) => intentHandlers.getRecentPurchases(enrichedArgs(args)),

        // Flash Deals & Promotions
        get_flash_deals: (args) => intentHandlers.getFlashDeals(enrichedArgs(args)),
        get_limited_time_offers: (args) => intentHandlers.getLimitedTimeOffers(enrichedArgs(args)),
        get_trending_now: (args) => intentHandlers.getTrendingNow(enrichedArgs(args)),

        // Advanced Marketing Features
        generate_personalized_discount: (args) => intentHandlers.generatePersonalizedDiscount(enrichedArgs(args)),
        calculate_bundle_savings: (args) => intentHandlers.calculateBundleSavings(enrichedArgs(args)),
        get_abandoned_cart: (args) => intentHandlers.getAbandonedCart(enrichedArgs(args)),
        send_cart_recovery_incentive: (args) => intentHandlers.sendCartRecoveryIncentive(enrichedArgs(args)),
        get_upgrade_suggestions: (args) => intentHandlers.getUpgradeSuggestions(enrichedArgs(args)),
        get_frequently_bought_together: (args) => intentHandlers.getFrequentlyBoughtTogether(enrichedArgs(args)),
    };
}

module.exports = { createFunctionMap };
