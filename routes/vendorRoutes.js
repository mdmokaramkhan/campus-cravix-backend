import { Router } from "express";
import { authMiddleware, requireVendor } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";
import {
  getProfile,
  updateProfile,
  updateCoverImage,
  updateProfilePic,
} from "../controllers/vendorController.js";

const router = Router();

router.use(authMiddleware);
router.use(requireVendor);

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.put("/me/cover", uploadSingle("coverImage"), updateCoverImage);
router.put("/me/profile-pic", uploadSingle("profilePic"), updateProfilePic);

export default router;
