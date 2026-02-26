import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOtp, verifyOtp } from "../services/otpService.js";

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
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role, vendorId: user.vendorId || null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({ success: true, token, user: { id: user._id, name: user.name, phone: user.phone, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
