import Order from "../models/Order.js";

// Valid status transitions for vendor
const VENDOR_STATUS_TRANSITIONS = {
  Confirmed: ["Preparing"],
  Preparing: ["Ready"],
  Ready: ["Collected"],
  Placed: ["Cancelled"],
  "Payment Pending": ["Cancelled"],
};

// Statuses from which vendor can cancel (before Collected)
const VENDOR_CANCEL_ALLOWED = ["Placed", "Payment Pending", "Confirmed", "Preparing", "Ready"];

// List orders for the logged-in vendor
export async function listVendorOrders(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const { status, limit = 50, skip = 0 } = req.query;

    const filter = { vendorId: req.user.vendorId };

    if (status && status.trim()) {
      const validStatuses = [
        "Placed",
        "Payment Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Collected",
        "Rated",
        "Cancelled",
      ];
      if (validStatuses.includes(status.trim())) {
        filter.status = status.trim();
      }
    }

    const orders = await Order.find(filter)
      .populate("studentId", "name phone")
      .sort({ createdAt: -1 })
      .skip(Math.max(0, parseInt(skip, 10)))
      .limit(Math.min(100, Math.max(1, parseInt(limit, 10))))
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update order status (Preparing → Ready, cancel, etc.)
export async function updateOrderStatus(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const { status: newStatus, cancelReason } = req.body;

    if (!newStatus || !newStatus.trim()) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const statusTrimmed = newStatus.trim();

    // Handle cancellation
    if (statusTrimmed === "Cancelled") {
      if (!VENDOR_CANCEL_ALLOWED.includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order. Vendor can only cancel before Collected. Current status: ${order.status}`,
        });
      }

      order.status = "Cancelled";
      order.cancelledBy = "vendor";
      order.cancelledAt = new Date();
      if (cancelReason && typeof cancelReason === "string") {
        order.cancelReason = cancelReason.trim();
      }
      await order.save();

      return res.json({
        success: true,
        order,
        message: "Order cancelled",
      });
    }

    // Handle regular status transition
    const allowedNext = VENDOR_STATUS_TRANSITIONS[order.status];
    if (!allowedNext || !allowedNext.includes(statusTrimmed)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${statusTrimmed}. Allowed: ${allowedNext?.join(", ") || "none"}`,
      });
    }

    order.status = statusTrimmed;
    await order.save();

    res.json({
      success: true,
      order,
      message: `Order status updated to ${statusTrimmed}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
