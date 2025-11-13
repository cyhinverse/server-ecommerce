const { Schema, model, Types } = require("mongoose");

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    parentCategory: { type: Types.ObjectId, ref: "Category", default: null },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "categories",
  }
);

module.exports = model("Category", categorySchema);
