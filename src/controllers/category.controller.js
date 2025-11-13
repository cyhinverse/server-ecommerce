const catchAsync = require("../configs/catchAsync");
const categoryService = require("../services/category.service");
const { StatusCodes } = require("http-status-codes");
const { sendSuccess, sendFail } = require("../shared/res/formatResponse");
const {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdParamValidator,
  categorySlugParamValidator,
  getCategoriesQueryValidator,
} = require("../validations/category.validator");

const CategoryController = {
  // Create category (Admin only)
  createCategory: catchAsync(async (req, res) => {
    // Validate request body
    const { error, value } = createCategoryValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const category = await categoryService.createCategory(value);

    return sendSuccess(
      res,
      category,
      "Category created successfully",
      StatusCodes.CREATED
    );
  }),

  // Get all categories (Admin)
  getAllCategories: catchAsync(async (req, res) => {
    // Validate query params
    const { error, value } = getCategoriesQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await categoryService.getAllCategories(value);

    return sendSuccess(
      res,
      result,
      "Categories retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get active categories (Public/User)
  getActiveCategories: catchAsync(async (req, res) => {
    // Validate query params
    const { error, value } = getCategoriesQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await categoryService.getActiveCategories(value);

    return sendSuccess(
      res,
      result,
      "Active categories retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get category tree (Public/User)
  getCategoryTree: catchAsync(async (req, res) => {
    const tree = await categoryService.getCategoryTree();

    return sendSuccess(
      res,
      tree,
      "Category tree retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get category by ID
  getCategoryById: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = categoryIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const category = await categoryService.getCategoryById(value.categoryId);

    return sendSuccess(
      res,
      category,
      "Category retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get category by slug
  getCategoryBySlug: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = categorySlugParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const category = await categoryService.getCategoryBySlug(value.slug);

    return sendSuccess(
      res,
      category,
      "Category retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Get category with subcategories
  getCategoryWithSubcategories: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = categoryIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await categoryService.getCategoryWithSubcategories(
      value.categoryId
    );

    return sendSuccess(
      res,
      result,
      "Category with subcategories retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Update category (Admin only)
  updateCategory: catchAsync(async (req, res) => {
    // Validate params
    const paramError = categoryIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (paramError.error) {
      const errors = paramError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate body
    const bodyError = updateCategoryValidator.validate(req.body, {
      abortEarly: false,
    });

    if (bodyError.error) {
      const errors = bodyError.error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { categoryId } = paramError.value;
    const category = await categoryService.updateCategory(
      categoryId,
      bodyError.value
    );

    return sendSuccess(
      res,
      category,
      "Category updated successfully",
      StatusCodes.OK
    );
  }),

  // Delete category (Admin only)
  deleteCategory: catchAsync(async (req, res) => {
    // Validate params
    const { error, value } = categoryIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await categoryService.deleteCategory(value.categoryId);

    return sendSuccess(res, result, result.message, StatusCodes.OK);
  }),

  // Get category statistics (Admin only)
  getCategoryStatistics: catchAsync(async (req, res) => {
    const stats = await categoryService.getCategoryStatistics();

    return sendSuccess(
      res,
      stats,
      "Category statistics retrieved successfully",
      StatusCodes.OK
    );
  }),
};

module.exports = CategoryController;
