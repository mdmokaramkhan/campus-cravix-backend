import { Router } from "express";
import { sendOtpHandler, verifyOtpHandler } from "../controllers/authController.js";

const router = Router();

router.post("/send-otp", sendOtpHandler);
router.post("/verify-otp", verifyOtpHandler);

export default router;
