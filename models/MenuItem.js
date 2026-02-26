import mongoose from "mongoose";

const optionChoiceSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    priceModifier: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    choices: {
      type: [optionChoiceSchema],
      default: [],
    },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ vendorId: 1 });
menuItemSchema.index({ vendorId: 1, category: 1 });
menuItemSchema.index({ vendorId: 1, available: 1 });

export default mongoose.model("MenuItem", menuItemSchema);
