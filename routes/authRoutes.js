import { Router } from "express";
import {
  sendOtpHandler,
  verifyOtpHandler,
  sendVendorSignupOtpHandler,
  verifyVendorSignupOtpHandler,
} from "../controllers/authController.js";

const router = Router();

router.post("/send-otp", sendOtpHandler);
router.post("/verify-otp", verifyOtpHandler);
router.post("/vendor/signup/send-otp", sendVendorSignupOtpHandler);
router.post("/vendor/signup/verify-otp", verifyVendorSignupOtpHandler);

export default router;
