const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/auth.middleware");
const upload = require("../configs/upload");

router.post(
  "/upload-avatar",
  verifyAccessToken,
  upload.single("avatar"),
  userController.uploadAvatar
);

router
  .route("/profile")
  .get(verifyAccessToken, userController.getProfile)
  .put(verifyAccessToken, userController.updateProfile);

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
router.post(
  "/update",
  verifyAccessToken,
  requireRole("admin"),
  userController.updateUser
);

// Specific routes first (before generic /:id)
router.put(
  "/:id/role",
  verifyAccessToken,
  requireRole("admin"),
  userController.updateUserRole
);

// Then generic routes
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

router.post("/address", verifyAccessToken, userController.addAddress);
router.put("/address/:id", verifyAccessToken, userController.updateAddress);
router.delete("/address/:id", verifyAccessToken, userController.deleteAddress);
router.get("/address", verifyAccessToken, userController.getAddresses);

router.put(
  "/change-password",
  verifyAccessToken,
  userController.changePassword
);

module.exports = router;
