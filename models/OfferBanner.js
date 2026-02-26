import mongoose from "mongoose";

const offerBannerSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

offerBannerSchema.index({ vendorId: 1 });
offerBannerSchema.index({ vendorId: 1, isActive: 1, displayOrder: 1 });

export default mongoose.model("OfferBanner", offerBannerSchema);
