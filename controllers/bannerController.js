import OfferBanner from "../models/OfferBanner.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// List all banners for this vendor
export async function listBanners(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const banners = await OfferBanner.find({
      vendorId: req.user.vendorId,
    }).sort({ displayOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      banners,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Create a new banner
export async function createBanner(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const { title, link, displayOrder, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required for banner",
      });
    }

    const imageUrl = await uploadImage(req.file, "campus-cravix/banners");

    const displayOrderNum =
      displayOrder !== undefined && displayOrder !== ""
        ? Number(displayOrder)
        : await getNextDisplayOrder(req.user.vendorId);

    const banner = await OfferBanner.create({
      vendorId: req.user.vendorId,
      image: imageUrl,
      title: title ? String(title).trim() : null,
      link: link ? String(link).trim() : null,
      displayOrder: Number.isNaN(displayOrderNum) ? 0 : displayOrderNum,
      isActive:
        isActive !== undefined ? isActive === true || isActive === "true" : true,
    });

    res.status(201).json({
      success: true,
      banner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update an existing banner
export async function updateBanner(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const banner = await OfferBanner.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const { title, link, displayOrder, isActive } = req.body;

    if (title !== undefined) banner.title = title ? String(title).trim() : null;
    if (link !== undefined) banner.link = link ? String(link).trim() : null;
    if (displayOrder !== undefined) {
      const num = Number(displayOrder);
      banner.displayOrder = Number.isNaN(num) ? banner.displayOrder : num;
    }
    if (isActive !== undefined)
      banner.isActive = isActive === true || isActive === "true";

    if (req.file) {
      if (banner.image) await deleteImage(banner.image);
      banner.image = await uploadImage(req.file, "campus-cravix/banners");
    }

    await banner.save();

    res.json({
      success: true,
      banner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete a banner
export async function deleteBanner(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const banner = await OfferBanner.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    if (banner.image) await deleteImage(banner.image);

    await OfferBanner.deleteOne({ _id: banner._id });

    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Reorder banners by providing array of banner IDs in desired order
export async function reorderBanners(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const { bannerIds } = req.body;

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "bannerIds array is required",
      });
    }

    const updates = bannerIds.map((id, index) =>
      OfferBanner.updateOne(
        { _id: id, vendorId: req.user.vendorId },
        { displayOrder: index }
      )
    );

    await Promise.all(updates);

    const banners = await OfferBanner.find({
      vendorId: req.user.vendorId,
    }).sort({ displayOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      banners,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getNextDisplayOrder(vendorId) {
  const last = await OfferBanner.findOne({ vendorId })
    .sort({ displayOrder: -1 })
    .select("displayOrder")
    .lean();
  return last ? (last.displayOrder ?? 0) + 1 : 0;
}
