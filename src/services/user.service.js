const userModel = require("../models/user.model");
const hashPassword = require("../utils/hashPasword");
const comparePassword = require("../utils/comparePassword");
const { getPaginationParams } = require("../utils/pagination");

class UserService {
  // Admin: Create new user
  async createUser(userData) {
    const {
      username,
      email,
      roles = "user",
      phone,
      isVerifiedEmail = false,
    } = userData;

    // Check if username already exists
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Generate default password (username + "123456")
    const defaultPassword = `${username}123456`;
    const hashedPassword = await hashPassword(defaultPassword);

    // Create user
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      roles,
      phone: phone || undefined,
      isVerifiedEmail,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
  }

  // Upload avatar
  async uploadAvatar(userId, url) {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { avatar: url },
      { new: true, select: "-password" }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Get user profile by ID
  async getUserProfile(userId) {
    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Update user profile
  async updateProfile(userId, data) {
    // Only allow specific fields
    const allowedData = {};
    const allowedFields = ["username", "email"];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        allowedData[field] = data[field];
      }
    });

    // Check if username or email already exists
    if (data.username) {
      const existingUser = await userModel.findOne({
        username: data.username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new Error("Username already exists");
      }
    }

    if (data.email) {
      const existingUser = await userModel.findOne({
        email: data.email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new Error("Email already exists");
      }
    }

    const user = await userModel.findByIdAndUpdate(userId, allowedData, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Add new address
  async addAddress(userId, addressData) {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $push: { addresses: addressData } },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Update address
  async updateAddress(userId, addressId, addressData) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new Error("Address not found");
    }

    // Update only provided fields
    Object.keys(addressData).forEach((key) => {
      if (addressData[key] !== undefined) {
        address[key] = addressData[key];
      }
    });

    await user.save();

    return user.toObject({ transform: true, versionKey: false });
  }

  // Delete address
  async deleteAddress(userId, addressId) {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true, select: "-password" }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Get all addresses
  async getAddresses(userId) {
    const user = await userModel.findById(userId).select("addresses");

    if (!user) {
      throw new Error("User not found");
    }

    return user.addresses;
  }

  // Change password
  async changePassword(userId, oldPassword, newPassword) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Verify old password
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Old password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return { message: "Password changed successfully" };
  }

  // Admin: Get all users with pagination
  async getAllUsers(query) {
    const { page, limit, search = "", role, isVerifiedEmail } = query;

    // Validate required params
    if (!page || !limit) {
      throw new Error("Page and limit are required parameters");
    }

    const filter = {};

    // Search by username or email
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role (only if not empty string)
    if (role && role !== "") {
      filter.roles = role;
    }

    // Filter by email verification (only if not empty string)
    if (isVerifiedEmail !== undefined && isVerifiedEmail !== "") {
      filter.isVerifiedEmail = isVerifiedEmail;
    }

    // Count total items first
    const total = await userModel.countDocuments(filter);

    // Get pagination params with total count
    const paginationParams = getPaginationParams(page, limit, total);

    // Execute query
    const users = await userModel
      .find(filter)
      .select("-password")
      .skip(paginationParams.skip)
      .limit(paginationParams.limit)
      .sort({ createdAt: -1 });

    return {
      data: users,
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

  // Admin: Get user by ID
  async getUserById(userId) {
    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Admin: Update user by ID
  async updateUserById(userId, updateData) {
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if updating username and it already exists
    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await userModel.findOne({
        username: updateData.username,
        _id: { $ne: userId },
      });
      if (existingUsername) {
        throw new Error("Username already exists");
      }
    }

    // Check if updating email and it already exists
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await userModel.findOne({
        email: updateData.email,
        _id: { $ne: userId },
      });
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Update user
    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    return updatedUser;
  }

  // Admin: Update user role
  async updateUserRole(userId, roles) {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { roles },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Admin: Update user permissions
  async updateUserPermissions(userId, permissions) {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { permissions },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Admin: Delete user (soft delete or permanent)
  async deleteUser(userId) {
    const user = await userModel.findByIdAndDelete(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return { message: "User deleted successfully" };
  }
}

module.exports = new UserService();
