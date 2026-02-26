import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedOptions: {
      type: [
        {
          name: String,
          label: String,
          priceModifier: Number,
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Order must have at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupTime: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "COD"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Placed",
        "Payment Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Collected",
        "Rated",
        "Cancelled",
      ],
      required: true,
      default: "Placed",
    },
    cancelledBy: {
      type: String,
      enum: ["student", "vendor"],
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ studentId: 1 });
orderSchema.index({ vendorId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ studentId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
