const joi = require("joi");

// Validate address object
const addressSchema = joi.object({
  _id: joi.string().optional(), // Allow _id from MongoDB
  fullName: joi.string().min(2).max(100).required().messages({
    "string.base": "Full name must be a string",
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must be at most 100 characters long",
    "any.required": "Full name is required",
  }),
  phone: joi
    .string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      "string.base": "Phone must be a string",
      "string.pattern.base": "Phone must be 10-11 digits",
      "any.required": "Phone is required",
    }),
  address: joi.string().allow("").messages({
    "string.base": "Address must be a string",
  }),
  city: joi.string().allow("").messages({
    "string.base": "City must be a string",
  }),
  district: joi.string().allow("").messages({
    "string.base": "District must be a string",
  }),
  ward: joi.string().allow("").messages({
    "string.base": "Ward must be a string",
  }),
});

// Update user profile validator
const updateProfileValidator = joi.object({
  username: joi.string().min(3).max(50).messages({
    "string.base": "Username must be a string",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 50 characters long",
  }),
  email: joi.string().email().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
  }),
  avatar: joi.string().uri().allow(null).messages({
    "string.base": "Avatar must be a string",
    "string.uri": "Avatar must be a valid URL",
  }),
});

// Add address validator
const addAddressValidator = joi.object({
  fullName: joi.string().min(2).max(100).required().messages({
    "string.base": "Full name must be a string",
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must be at most 100 characters long",
    "any.required": "Full name is required",
  }),
  phone: joi
    .string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      "string.base": "Phone must be a string",
      "string.pattern.base": "Phone must be 10-11 digits",
      "any.required": "Phone is required",
    }),
  address: joi.string().required().messages({
    "string.base": "Address must be a string",
    "any.required": "Address is required",
  }),
  city: joi.string().required().messages({
    "string.base": "City must be a string",
    "any.required": "City is required",
  }),
  district: joi.string().required().messages({
    "string.base": "District must be a string",
    "any.required": "District is required",
  }),
  ward: joi.string().required().messages({
    "string.base": "Ward must be a string",
    "any.required": "Ward is required",
  }),
});

// Update address validator
const updateAddressValidator = joi.object({
  fullName: joi.string().min(2).max(100).messages({
    "string.base": "Full name must be a string",
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must be at most 100 characters long",
  }),
  phone: joi
    .string()
    .pattern(/^[0-9]{10,11}$/)
    .messages({
      "string.base": "Phone must be a string",
      "string.pattern.base": "Phone must be 10-11 digits",
    }),
  address: joi.string().messages({
    "string.base": "Address must be a string",
  }),
  city: joi.string().messages({
    "string.base": "City must be a string",
  }),
  district: joi.string().messages({
    "string.base": "District must be a string",
  }),
  ward: joi.string().messages({
    "string.base": "Ward must be a string",
  }),
});

// Change password validator
const changePasswordValidator = joi.object({
  oldPassword: joi.string().required().messages({
    "string.base": "Old password must be a string",
    "any.required": "Old password is required",
  }),
  newPassword: joi.string().min(6).required().messages({
    "string.base": "New password must be a string",
    "string.min": "New password must be at least 6 characters long",
    "any.required": "New password is required",
  }),
  confirmPassword: joi
    .string()
    .valid(joi.ref("newPassword"))
    .required()
    .messages({
      "string.base": "Confirm password must be a string",
      "any.only": "Confirm password must match new password",
      "any.required": "Confirm password is required",
    }),
});

// MongoDB ObjectId param validator
const mongoIdParamValidator = joi.object({
  id: joi
    .string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
});

// Address ID param validator
const addressIdParamValidator = joi.object({
  id: joi
    .string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid address ID format",
      "any.required": "Address ID is required",
    }),
});

// Update user by ID validator (Admin only)
// Update user validator (with ID in body)
const updateUserValidator = joi.object({
  id: joi
    .string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
  username: joi.string().min(3).max(50).messages({
    "string.base": "Username must be a string",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 50 characters long",
  }),
  email: joi.string().email().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
  }),
  roles: joi.string().valid("user", "admin").messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'user' or 'admin'",
  }),
  isVerifiedEmail: joi.boolean().messages({
    "boolean.base": "isVerifiedEmail must be a boolean",
  }),
  avatar: joi.string().uri().allow(null, "").messages({
    "string.base": "Avatar must be a string",
    "string.uri": "Avatar must be a valid URL",
  }),
});

const updateUserByIdValidator = joi.object({
  username: joi.string().min(3).max(50).messages({
    "string.base": "Username must be a string",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 50 characters long",
  }),
  email: joi.string().email().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
  }),
  roles: joi.string().valid("user", "admin").messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'user' or 'admin'",
  }),
  isVerifiedEmail: joi.boolean().messages({
    "boolean.base": "isVerifiedEmail must be a boolean",
  }),
  avatar: joi.string().uri().allow(null, "").messages({
    "string.base": "Avatar must be a string",
    "string.uri": "Avatar must be a valid URL",
  }),
});

// Update user role validator (Admin only)
const updateRoleValidator = joi.object({
  roles: joi.string().valid("user", "admin").required().messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'user' or 'admin'",
    "any.required": "Role is required",
  }),
});

// Update permissions validator (Admin only)
const updatePermissionsValidator = joi.object({
  permissions: joi.array().items(joi.string()).required().messages({
    "array.base": "Permissions must be an array",
    "string.base": "Each permission must be a string",
    "any.required": "Permissions is required",
  }),
});

// Create user validator (Admin only)
const createUserValidator = joi.object({
  username: joi.string().min(3).max(50).required().messages({
    "string.base": "Username must be a string",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 50 characters long",
    "any.required": "Username is required",
  }),
  email: joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  roles: joi.string().valid("user", "admin").default("user").messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'user' or 'admin'",
  }),
  isVerifiedEmail: joi.boolean().default(false).messages({
    "boolean.base": "isVerifiedEmail must be a boolean",
  }),
  password: joi.string().optional().min(6).messages({
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 6 characters long",
  }),
});

// Pagination query validator
const paginationQueryValidator = joi.object({
  page: joi.number().integer().min(1).required().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
    "any.required": "Page is required",
  }),
  limit: joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
    "any.required": "Limit is required",
  }),
  search: joi.string().allow("").messages({
    "string.base": "Search must be a string",
  }),
  role: joi.string().valid("user", "admin").allow("").messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'user' or 'admin'",
  }),
  isVerifiedEmail: joi.boolean().allow("").messages({
    "boolean.base": "isVerifiedEmail must be a boolean",
  }),
});

module.exports = {
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
};
