const catchAsync = require("../configs/catchAsync");
const { uploadImage } = require("../configs/cloudinary");
const userService = require("../services/user.service");
const { sendFail, sendSuccess } = require("../shared/res/formatResponse");
const { StatusCodes } = require("http-status-codes");
const {
  createUserValidator,
  updateUserValidator,
  updateUserByIdValidator,
  updateProfileValidator,
  addAddressValidator,
  updateAddressValidator,
  changePasswordValidator,
  mongoIdParamValidator,
  addressIdParamValidator,
  updateRoleValidator,
  updatePermissionsValidator,
  paginationQueryValidator,
} = require("../validations/user.validator");

const UserController = {
  // Admin: Create new user
  createUser: catchAsync(async (req, res) => {
    const { error, value } = createUserValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const user = await userService.createUser(value);
    return sendSuccess(
      res,
      user,
      "User created successfully",
      StatusCodes.CREATED
    );
  }),

  // Admin: Update user (with ID in body)
  updateUser: catchAsync(async (req, res) => {
    const { error, value } = updateUserValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Extract id from validated data
    const { id, ...updateData } = value;

    // Check if there's data to update
    if (!updateData || Object.keys(updateData).length === 0) {
      return sendFail(
        res,
        "No data provided for update",
        StatusCodes.BAD_REQUEST
      );
    }

    const user = await userService.updateUserById(id, updateData);
    return sendSuccess(res, user, "User updated successfully", StatusCodes.OK);
  }),

  // Upload avatar
  uploadAvatar: catchAsync(async (req, res) => {
    const file = req.file;
    const userId = req.user.userId;

    if (!file) {
      return sendFail(res, "No file uploaded", StatusCodes.BAD_REQUEST);
    }

    const result = await uploadImage(file.buffer);
    if (!result) {
      return sendFail(
        res,
        "Image upload failed",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const user = await userService.uploadAvatar(userId, result.secure_url);
    return sendSuccess(
      res,
      user,
      "Avatar uploaded successfully",
      StatusCodes.OK
    );
  }),

  // Get current user profile
  getProfile: catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const user = await userService.getUserProfile(userId);
    return sendSuccess(
      res,
      user,
      "Profile retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Update user profile
  updateProfile: catchAsync(async (req, res) => {
    const { error, value } = updateProfileValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const user = await userService.updateProfile(userId, value);
    return sendSuccess(
      res,
      user,
      "Profile updated successfully",
      StatusCodes.OK
    );
  }),

  // Add new address
  addAddress: catchAsync(async (req, res) => {
    const { error, value } = addAddressValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const user = await userService.addAddress(userId, value);
    return sendSuccess(
      res,
      user,
      "Address added successfully",
      StatusCodes.CREATED
    );
  }),

  // Update address
  updateAddress: catchAsync(async (req, res) => {
    const { error: paramError, value: paramValue } =
      addressIdParamValidator.validate(req.params, { abortEarly: false });

    if (paramError) {
      const errors = paramError.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { error, value } = updateAddressValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const user = await userService.updateAddress(
      userId,
      paramValue.addressId,
      value
    );
    return sendSuccess(
      res,
      user,
      "Address updated successfully",
      StatusCodes.OK
    );
  }),

  // Delete address
  deleteAddress: catchAsync(async (req, res) => {
    const { error, value } = addressIdParamValidator.validate(req.params, {
      abortEarly: false,
    });
    console.log(req.params)
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const user = await userService.deleteAddress(userId, value.id);
    if(!user) {
      throw new Error("Error")
    }
    return sendSuccess(
      res,
      user,
      "Address deleted successfully",
      StatusCodes.OK
    );
  }),

  // Get all addresses
  getAddresses: catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const addresses = await userService.getAddresses(userId);
    return sendSuccess(
      res,
      addresses,
      "Addresses retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Change password
  changePassword: catchAsync(async (req, res) => {
    const { error, value } = changePasswordValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const userId = req.user.userId;
    const result = await userService.changePassword(
      userId,
      value.oldPassword,
      value.newPassword
    );
    return sendSuccess(res, result, result.message, StatusCodes.OK);
  }),

  // Admin: Get all users
  getAllUsers: catchAsync(async (req, res) => {
    const { error, value } = paginationQueryValidator.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await userService.getAllUsers(value);
    return sendSuccess(
      res,
      result,
      "Users retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Admin: Get user by ID
  getUserById: catchAsync(async (req, res) => {
    const { error, value } = mongoIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const user = await userService.getUserById(value.id);
    return sendSuccess(
      res,
      user,
      "User retrieved successfully",
      StatusCodes.OK
    );
  }),

  // Admin: Update user by ID
  updateUserById: catchAsync(async (req, res) => {
    // Validate params
    const { error: paramError, value: paramValue } =
      mongoIdParamValidator.validate(req.params, {
        abortEarly: false,
      });

    if (paramError) {
      const errors = paramError.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Validate body
    const { error: bodyError, value: bodyValue } =
      updateUserByIdValidator.validate(req.body, {
        abortEarly: false,
      });

    if (bodyError) {
      const errors = bodyError.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    // Check if there's data to update
    if (!bodyValue || Object.keys(bodyValue).length === 0) {
      return sendFail(
        res,
        "No data provided for update",
        StatusCodes.BAD_REQUEST
      );
    }

    const user = await userService.updateUserById(paramValue.id, bodyValue);
    return sendSuccess(res, user, "User updated successfully", StatusCodes.OK);
  }),

  // Admin: Update user role
  updateUserRole: catchAsync(async (req, res) => {
    const { error: paramError, value: paramValue } =
      mongoIdParamValidator.validate(req.params, { abortEarly: false });

    if (paramError) {
      const errors = paramError.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { error, value } = updateRoleValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const user = await userService.updateUserRole(paramValue.id, value.roles);
    return sendSuccess(
      res,
      user,
      "User role updated successfully",
      StatusCodes.OK
    );
  }),

  // Admin: Update user permissions
  updateUserPermissions: catchAsync(async (req, res) => {
    const { error: paramError, value: paramValue } =
      mongoIdParamValidator.validate(req.params, { abortEarly: false });

    if (paramError) {
      const errors = paramError.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const { error, value } = updatePermissionsValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const user = await userService.updateUserPermissions(
      paramValue.id,
      value.permissions
    );
    return sendSuccess(
      res,
      user,
      "User permissions updated successfully",
      StatusCodes.OK
    );
  }),

  // Admin: Delete user
  deleteUser: catchAsync(async (req, res) => {
    const { error, value } = mongoIdParamValidator.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendFail(res, errors.join(", "), StatusCodes.BAD_REQUEST);
    }

    const result = await userService.deleteUser(value.id);
    return sendSuccess(res, result, result.message, StatusCodes.OK);
  }),
};

module.exports = UserController;
