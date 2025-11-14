const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/auth.middleware");
const upload = require("../configs/upload");

// Upload routes
router.post(
  "/upload-avatar",
  verifyAccessToken,
  upload.single("avatar"),
  userController.uploadAvatar
);

// Profile routes
router
  .route("/profile")
  .get(verifyAccessToken, userController.getProfile)
  .put(verifyAccessToken, userController.updateProfile);

// User management routes (Admin only)
router.get(
  "/",
  verifyAccessToken,
  requireRole("admin"),
  userController.getAllUsers
);

router.post(
  "/create",
  verifyAccessToken,
  requireRole("admin"),
  userController.createUser
);

// UPDATE USER - Sử dụng POST (như bạn muốn)
router.post(
  "/update",
  verifyAccessToken,
  requireRole("admin"),
  userController.updateUser
);

// Role management
router.put(
  "/:id/role",
  verifyAccessToken,
  requireRole("admin"),
  userController.updateUserRole
);

// User by ID routes
router
  .route("/:id")
  .get(verifyAccessToken, requireRole("admin"), userController.getUserById)
  .put(verifyAccessToken, requireRole("admin"), userController.updateUserById);

router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin"),
  userController.deleteUser
);

// Address routes
router.post("/address", verifyAccessToken, userController.addAddress);
router.put("/address/:id", verifyAccessToken, userController.updateAddress);
router.delete("/address/:id", verifyAccessToken, userController.deleteAddress);
router.get("/address", verifyAccessToken, userController.getAddresses);

// Password management
router.put(
  "/change-password",
  verifyAccessToken,
  userController.changePassword
);

module.exports = router;
