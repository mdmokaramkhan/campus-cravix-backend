import Coupon from "../models/Coupon.js";

// List all coupons for this vendor
export async function listCoupons(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const coupons = await Coupon.find({
      vendorId: req.user.vendorId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      coupons,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Create a new coupon
export async function createCoupon(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const { code, discountType, discountValue, minOrderAmount, expiryDate } =
      req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    if (!discountType || !["PERCENT", "FLAT"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "discountType must be PERCENT or FLAT",
      });
    }

    const value = Number(discountValue);
    if (Number.isNaN(value) || value < 0) {
      return res.status(400).json({
        success: false,
        message: "discountValue must be a non-negative number",
      });
    }

    if (discountType === "PERCENT" && value > 100) {
      return res.status(400).json({
        success: false,
        message: "discountValue for PERCENT cannot exceed 100",
      });
    }

    if (discountType === "FLAT" && value === 0) {
      return res.status(400).json({
        success: false,
        message: "discountValue for FLAT must be greater than 0",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: "expiryDate is required",
      });
    }

    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: "expiryDate must be a valid date",
      });
    }

    if (expiry <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "expiryDate must be in the future",
      });
    }

    const minAmount =
      minOrderAmount !== undefined && minOrderAmount !== ""
        ? Number(minOrderAmount)
        : 0;
    if (Number.isNaN(minAmount) || minAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "minOrderAmount must be a non-negative number",
      });
    }

    const coupon = await Coupon.create({
      vendorId: req.user.vendorId,
      code: String(code).trim().toUpperCase(),
      discountType,
      discountValue: value,
      minOrderAmount: minAmount,
      expiryDate: expiry,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists for your stall",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update an existing coupon
export async function updateCoupon(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const coupon = await Coupon.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate,
      isActive,
    } = req.body;

    if (typeof code === "string" && code.trim()) {
      coupon.code = String(code).trim().toUpperCase();
    }

    if (discountType !== undefined) {
      if (!["PERCENT", "FLAT"].includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: "discountType must be PERCENT or FLAT",
        });
      }
      coupon.discountType = discountType;
    }

    if (discountValue !== undefined) {
      const value = Number(discountValue);
      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "discountValue must be a non-negative number",
        });
      }
      if (coupon.discountType === "PERCENT" && value > 100) {
        return res.status(400).json({
          success: false,
          message: "discountValue for PERCENT cannot exceed 100",
        });
      }
      if (coupon.discountType === "FLAT" && value === 0) {
        return res.status(400).json({
          success: false,
          message: "discountValue for FLAT must be greater than 0",
        });
      }
      coupon.discountValue = value;
    }

    if (minOrderAmount !== undefined) {
      const minAmount = Number(minOrderAmount);
      if (Number.isNaN(minAmount) || minAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "minOrderAmount must be a non-negative number",
        });
      }
      coupon.minOrderAmount = minAmount;
    }

    if (expiryDate !== undefined) {
      const expiry = new Date(expiryDate);
      if (Number.isNaN(expiry.getTime())) {
        return res.status(400).json({
          success: false,
          message: "expiryDate must be a valid date",
        });
      }
      coupon.expiryDate = expiry;
    }

    if (isActive !== undefined) {
      coupon.isActive = isActive === true || isActive === "true";
    }

    await coupon.save();

    res.json({
      success: true,
      coupon,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists for your stall",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

// Deactivate a coupon (soft toggle via isActive)
export async function deactivateCoupon(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const coupon = await Coupon.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = false;
    await coupon.save();

    res.json({
      success: true,
      coupon,
      message: "Coupon deactivated",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete a coupon (hard delete)
export async function deleteCoupon(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const coupon = await Coupon.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await Coupon.deleteOne({ _id: coupon._id });

    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
