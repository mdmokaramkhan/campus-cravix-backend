import Vendor from "../models/Vendor.js";
import cloudinary from "../config/cloudinary.js";

/**
 * GET /vendors/me - Get current vendor's profile
 */
export async function getProfile(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        stallNumber: vendor.stallNumber,
        profilePic: vendor.profilePic,
        coverImage: vendor.coverImage,
        openingHours: vendor.openingHours,
        isOpen: vendor.isOpen,
        rating: vendor.rating,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /vendors/me - Update current vendor's profile
 * Accepts JSON body: name, stallNumber, openingHours, isOpen
 */
export async function updateProfile(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    const { name, stallNumber, openingHours, isOpen } = req.body;

    if (name !== undefined) vendor.name = name.trim();
    if (stallNumber !== undefined) vendor.stallNumber = stallNumber.trim();
    if (isOpen !== undefined) vendor.isOpen = Boolean(isOpen);

    if (openingHours !== undefined) {
      const validated = validateOpeningHours(openingHours);
      if (!validated.valid) {
        return res.status(400).json({
          success: false,
          message: validated.error,
        });
      }
      vendor.openingHours = validated.hours;
    }

    await vendor.save();

    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        stallNumber: vendor.stallNumber,
        profilePic: vendor.profilePic,
        coverImage: vendor.coverImage,
        openingHours: vendor.openingHours,
        isOpen: vendor.isOpen,
        rating: vendor.rating,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /vendors/me/cover - Upload cover image via Cloudinary
 * Expects multipart/form-data with 'coverImage' file field
 */
export async function updateCoverImage(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Cover image file is required",
      });
    }

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    // Delete old cover from Cloudinary if exists
    if (vendor.coverImage) {
      const publicId = extractCloudinaryPublicId(vendor.coverImage);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "campus-cravix/vendors/covers",
      resource_type: "image",
    });

    vendor.coverImage = result.secure_url;
    await vendor.save();

    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        stallNumber: vendor.stallNumber,
        profilePic: vendor.profilePic,
        coverImage: vendor.coverImage,
        openingHours: vendor.openingHours,
        isOpen: vendor.isOpen,
        rating: vendor.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /vendors/me/profile-pic - Upload profile picture via Cloudinary
 * Expects multipart/form-data with 'profilePic' file field
 */
export async function updateProfilePic(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile picture file is required",
      });
    }

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    if (vendor.profilePic) {
      const publicId = extractCloudinaryPublicId(vendor.profilePic);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "campus-cravix/vendors/profile-pics",
      resource_type: "image",
    });

    vendor.profilePic = result.secure_url;
    await vendor.save();

    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        stallNumber: vendor.stallNumber,
        profilePic: vendor.profilePic,
        coverImage: vendor.coverImage,
        openingHours: vendor.openingHours,
        isOpen: vendor.isOpen,
        rating: vendor.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function validateOpeningHours(hours) {
  if (!Array.isArray(hours)) {
    return { valid: false, error: "openingHours must be an array" };
  }
  const validated = [];
  for (const h of hours) {
    if (
      typeof h.dayOfWeek !== "number" ||
      h.dayOfWeek < 0 ||
      h.dayOfWeek > 6 ||
      typeof h.open !== "string" ||
      typeof h.close !== "string"
    ) {
      return {
        valid: false,
        error: "Each entry must have dayOfWeek (0-6), open, and close",
      };
    }
    validated.push({
      dayOfWeek: h.dayOfWeek,
      open: String(h.open).trim(),
      close: String(h.close).trim(),
    });
  }
  return { valid: true, hours: validated };
}

function extractCloudinaryPublicId(url) {
  const match = url.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}
