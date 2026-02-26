import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUND_PENDING", "REFUNDED"],
      required: true,
      default: "PENDING",
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    refundTransactionId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });

export default mongoose.model("Payment", paymentSchema);
