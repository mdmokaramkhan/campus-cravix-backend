import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import { sendOtp, verifyOtp } from "../services/otpService.js";

function createAuthToken(user) {
  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role, vendorId: user.vendorId || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Send OTP to user's phone so they can log in
export async function sendOtpHandler(req, res) {
  try {
    const phone = req.body.phone;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone required" });
    }

    await sendOtp(phone.trim(), "phone");
    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Check OTP, log user in, and return a token (creates new user if first time)
export async function verifyOtpHandler(req, res) {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP required" });
    }

    const result = await verifyOtp(phone.trim(), otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: "Wrong or expired OTP" });
    }

    // If first time, create user in database
    let user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      user = await User.create({ name: name || "User", phone: phone.trim(), role: "student" });
    }

    // Create login token
    const token = createAuthToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        vendorId: user.vendorId?.toString() ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Send OTP for vendor signup flow
export async function sendVendorSignupOtpHandler(req, res) {
  try {
    const phone = req.body.phone;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone required" });
    }

    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Account already exists for this phone. Please login instead.",
      });
    }

    await sendOtp(phone.trim(), "phone");
    res.json({ success: true, message: "OTP sent for vendor signup" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Verify OTP and create vendor + vendor user
export async function verifyVendorSignupOtpHandler(req, res) {
  try {
    const { phone, otp, name, stallNumber, openingHours } = req.body;

    if (!phone || !otp || !name || !stallNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP, name, and stallNumber are required",
      });
    }

    const existingUser = await User.findOne({ phone: phone.trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Account already exists for this phone. Please login instead.",
      });
    }

    const existingVendor = await Vendor.findOne({ stallNumber: stallNumber.trim() });
    if (existingVendor) {
      return res.status(409).json({
        success: false,
        message: "Stall number already exists",
      });
    }

    const result = await verifyOtp(phone.trim(), otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: "Wrong or expired OTP" });
    }

    const hours = Array.isArray(openingHours) ? openingHours : [];
    const vendor = await Vendor.create({
      name: name.trim(),
      stallNumber: stallNumber.trim(),
      openingHours: hours,
    });

    let user;
    try {
      user = await User.create({
        name: name.trim(),
        phone: phone.trim(),
        role: "vendor",
        vendorId: vendor._id,
      });
    } catch (err) {
      await Vendor.deleteOne({ _id: vendor._id });
      throw err;
    }

    const token = createAuthToken(user);
    res.status(201).json({
      success: true,
      message: "Vendor account created",
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
      vendor: {
        id: vendor._id,
        name: vendor.name,
        stallNumber: vendor.stallNumber,
        openingHours: vendor.openingHours,
        isOpen: vendor.isOpen,
        profilePic: vendor.profilePic,
        coverImage: vendor.coverImage,
        rating: vendor.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
