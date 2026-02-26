import Vendor from "../models/Vendor.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// Get the logged-in vendor's profile
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
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
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

// Update vendor's name, stall number, hours, etc.
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
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    const { name, stallNumber, openingHours, isOpen } = req.body;

    // Update only the fields that were sent
    if (name !== undefined) vendor.name = name.trim();
    if (stallNumber !== undefined) vendor.stallNumber = stallNumber.trim();
    if (isOpen !== undefined) vendor.isOpen = Boolean(isOpen);

    if (openingHours !== undefined) {
      const validated = validateOpeningHours(openingHours);
      if (!validated.valid) {
        return res.status(400).json({ success: false, message: validated.error });
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

// Upload a new cover image (replaces the old one)
export async function updateCoverImage(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Cover image file is required" });
    }

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    if (vendor.coverImage) await deleteImage(vendor.coverImage);
    vendor.coverImage = await uploadImage(req.file, "campus-cravix/vendors/covers");
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

// Upload a new profile picture (replaces the old one)
export async function updateProfilePic(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Profile picture file is required" });
    }

    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    if (vendor.profilePic) await deleteImage(vendor.profilePic);
    vendor.profilePic = await uploadImage(req.file, "campus-cravix/vendors/profile-pics");
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

// Checks if opening hours are valid: array of { dayOfWeek, open, close }
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
