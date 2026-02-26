import { Router } from "express";
import authRoutes from "./authRoutes.js";
import vendorRoutes from "./vendorRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);

export default router;
