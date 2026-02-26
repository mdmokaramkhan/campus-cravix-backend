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
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "../controllers/bannerController.js";

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

router.get("/banners", listBanners);
router.post("/banners", uploadSingle("image"), createBanner);
router.patch("/banners/reorder", reorderBanners);
router.put("/banners/:id", uploadSingle("image"), updateBanner);
router.delete("/banners/:id", deleteBanner);

export default router;
