import mongoose from "mongoose";

const openingHoursSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    open: {
      type: String,
      required: true,
    },
    close: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stallNumber: {
      type: String,
      required: true,
      trim: true,
    },
    profilePic: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    openingHours: {
      type: [openingHoursSchema],
      default: [],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ stallNumber: 1 }, { unique: true });
vendorSchema.index({ isOpen: 1 });
vendorSchema.index({ rating: -1 });

export default mongoose.model("Vendor", vendorSchema);
