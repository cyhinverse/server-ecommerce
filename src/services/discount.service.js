const Discount = require("../models/discount.model");
const { getPaginationParams } = require("../utils/pagination");

class DiscountService {
  // Create new discount (Admin)
  async createDiscount(discountData) {
    // Check if code already exists
    const existingDiscount = await Discount.findOne({
      code: discountData.code.toUpperCase(),
    });

    if (existingDiscount) {
      throw new Error("Discount code already exists");
    }

    // Validate discount value for percent type
    if (
      discountData.discountType === "percent" &&
      discountData.discountValue > 100
    ) {
      throw new Error("Percent discount cannot exceed 100%");
    }

    // Create discount
    const discount = await Discount.create({
      ...discountData,
      code: discountData.code.toUpperCase(),
    });

    return discount;
  }

  // Get all discounts with filters
  async getAllDiscounts(filters = {}) {
    const { page = 1, limit = 10, isActive, discountType } = filters;

    // Build query
    const query = {};

    if (typeof isActive === "boolean") {
      query.isActive = isActive;
    }

    if (discountType) {
      query.discountType = discountType;
    }

    // Count total items first
    const total = await Discount.countDocuments(query);

    // Get pagination params with total count
    const paginationParams = getPaginationParams(page, limit, total);

    // Execute query
    const discounts = await Discount.find(query)
      .populate("applicableProducts", "name slug images")
      .sort({ createdAt: -1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit);

    return {
      data: discounts,
      pagination: {
        currentPage: paginationParams.currentPage,
        pageSize: paginationParams.pageSize,
        totalPages: paginationParams.totalPages,
        totalItems: paginationParams.totalItems,
        hasNextPage: paginationParams.hasNextPage,
        hasPrevPage: paginationParams.hasPrevPage,
        nextPage: paginationParams.nextPage,
        prevPage: paginationParams.prevPage,
      },
    };
  }

  // Get active discounts (for users)
  async getActiveDiscounts(filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const now = new Date();

    // Query for active and valid discounts
    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    // Count total items first
    const total = await Discount.countDocuments(query);

    // Get pagination params with total count
    const paginationParams = getPaginationParams(page, limit, total);

    // Execute query with usage limit filter in code
    let discounts = await Discount.find(query)
      .select("-__v")
      .populate("applicableProducts", "name slug images")
      .sort({ createdAt: -1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit);

    // Filter by usage limit
    discounts = discounts.filter(
      (discount) => discount.usedCount < discount.usageLimit
    );

    return {
      data: discounts,
      pagination: {
        currentPage: paginationParams.currentPage,
        pageSize: paginationParams.pageSize,
        totalPages: paginationParams.totalPages,
        totalItems: paginationParams.totalItems,
        hasNextPage: paginationParams.hasNextPage,
        hasPrevPage: paginationParams.hasPrevPage,
        nextPage: paginationParams.nextPage,
        prevPage: paginationParams.prevPage,
      },
    };
  }

  // Get discount by ID
  async getDiscountById(discountId) {
    const discount = await Discount.findById(discountId).populate(
      "applicableProducts",
      "name slug images"
    );

    if (!discount) {
      throw new Error("Discount not found");
    }

    return discount;
  }

  // Get discount by code
  async getDiscountByCode(code) {
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
    }).populate("applicableProducts", "name slug images");

    if (!discount) {
      throw new Error("Discount code not found");
    }

    return discount;
  }

  // Update discount
  async updateDiscount(discountId, updateData) {
    const discount = await Discount.findById(discountId);

    if (!discount) {
      throw new Error("Discount not found");
    }

    // If updating code, check uniqueness
    if (updateData.code && updateData.code !== discount.code) {
      const existingDiscount = await Discount.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: discountId },
      });

      if (existingDiscount) {
        throw new Error("Discount code already exists");
      }

      updateData.code = updateData.code.toUpperCase();
    }

    // Validate discount value for percent type
    if (updateData.discountType === "percent" && updateData.discountValue) {
      if (updateData.discountValue > 100) {
        throw new Error("Percent discount cannot exceed 100%");
      }
    }

    // Validate date range if updating dates
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || discount.startDate;
      const endDate = updateData.endDate || discount.endDate;

      if (new Date(endDate) <= new Date(startDate)) {
        throw new Error("End date must be after start date");
      }
    }

    // Update discount
    Object.assign(discount, updateData);
    await discount.save();

    return discount;
  }

  // Delete discount
  async deleteDiscount(discountId) {
    const discount = await Discount.findById(discountId);

    if (!discount) {
      throw new Error("Discount not found");
    }

    await discount.deleteOne();

    return { message: "Discount deleted successfully" };
  }

  // Apply discount code (validate and calculate discount)
  async applyDiscount(code, orderTotal, productIds = []) {
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
    });

    if (!discount) {
      throw new Error("Invalid discount code");
    }

    // Check if discount is active
    if (!discount.isActive) {
      throw new Error("Discount code is not active");
    }

    // Check date validity
    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
      throw new Error("Discount code is expired or not yet valid");
    }

    // Check usage limit
    if (discount.usedCount >= discount.usageLimit) {
      throw new Error("Discount code usage limit reached");
    }

    // Check minimum order value
    if (orderTotal < discount.minOrderValue) {
      throw new Error(
        `Minimum order value of ${discount.minOrderValue.toLocaleString()} VND required`
      );
    }

    // Check applicable products
    if (discount.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some((productId) =>
        discount.applicableProducts.some(
          (applicableId) => applicableId.toString() === productId.toString()
        )
      );

      if (!hasApplicableProduct) {
        throw new Error("Discount not applicable to selected products");
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discountType === "percent") {
      discountAmount = (orderTotal * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      discountId: discount._id,
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: Math.round(discountAmount),
      finalTotal: Math.round(orderTotal - discountAmount),
      originalTotal: orderTotal,
    };
  }

  // Increment usage count (call after successful order)
  async incrementUsageCount(discountId) {
    const discount = await Discount.findById(discountId);

    if (!discount) {
      throw new Error("Discount not found");
    }

    discount.usedCount += 1;
    await discount.save();

    return discount;
  }

  // Get discount statistics (Admin)
  async getDiscountStatistics() {
    const totalDiscounts = await Discount.countDocuments();
    const activeDiscounts = await Discount.countDocuments({ isActive: true });
    const expiredDiscounts = await Discount.countDocuments({
      endDate: { $lt: new Date() },
    });

    const mostUsedDiscounts = await Discount.find()
      .sort({ usedCount: -1 })
      .limit(5)
      .select("code description usedCount usageLimit");

    return {
      totalDiscounts,
      activeDiscounts,
      expiredDiscounts,
      mostUsedDiscounts,
    };
  }
}

module.exports = new DiscountService();
