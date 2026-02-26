import Otp from "../models/Otp.js";

/**
 * Send OTP to user
 * 1. Generate 6-digit code
 * 2. Save to DB
 * 3. Call your API to deliver it
 */
export async function sendOtp(phoneOrEmail, channel = "phone") {
  const identifier = phoneOrEmail.trim();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresInMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await Otp.findOneAndUpdate(
    { identifier },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  const apiUrl = process.env.OTP_API_URL;
  if (!apiUrl) {
    throw new Error("OTP_API_URL missing in .env");
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp, channel }),
  });

  if (!res.ok) {
    throw new Error("Failed to send OTP");
  }

  return { success: true };
}

/**
 * Verify OTP
 * Returns { valid: true } if correct, { valid: false } if wrong or expired
 * Deletes OTP from DB on successful verify
 */
export async function verifyOtp(phoneOrEmail, otp) {
  const identifier = phoneOrEmail.trim();
  const stored = await Otp.findOne({ identifier });

  if (!stored) return { valid: false };
  if (Date.now() > stored.expiresAt.getTime()) {
    await Otp.deleteOne({ identifier });
    return { valid: false };
  }

  const valid = stored.otp === String(otp).trim();
  if (valid) await Otp.deleteOne({ identifier });

  return { valid };
}
