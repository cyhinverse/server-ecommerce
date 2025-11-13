const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/auth.middleware");

// Public routes (no authentication required)
router.get("/active", categoryController.getActiveCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// Admin routes (require admin role)
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.createCategory
);
router.get(
  "/",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.getAllCategories
);
router.get(
  "/statistics",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.getCategoryStatistics
);
router.get(
  "/:categoryId",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.getCategoryById
);
router.get(
  "/:categoryId/subcategories",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.getCategoryWithSubcategories
);
router.put(
  "/:categoryId",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.updateCategory
);
router.delete(
  "/:categoryId",
  verifyAccessToken,
  requireRole("admin"),
  categoryController.deleteCategory
);

module.exports = router;
