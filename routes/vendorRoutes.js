import { Router } from "express";
import { authMiddleware, requireVendor } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";
import {
  getProfile,
  updateProfile,
  updateCoverImage,
  updateProfilePic,
} from "../controllers/vendorController.js";
import {
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";

const router = Router();

router.use(authMiddleware);
router.use(requireVendor);

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.put("/me/cover", uploadSingle("coverImage"), updateCoverImage);
router.put("/me/profile-pic", uploadSingle("profilePic"), updateProfilePic);

router.get("/menu", listMenu);
router.post("/menu", uploadSingle("image"), createMenuItem);
router.put("/menu/:id", uploadSingle("image"), updateMenuItem);
router.delete("/menu/:id", deleteMenuItem);

export default router;
