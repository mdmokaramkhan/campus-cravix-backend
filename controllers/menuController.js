import MenuItem from "../models/MenuItem.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// Turns options (like size, toppings) from JSON string into a clean array
function parseOptions(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o) =>
        o &&
        typeof o.name === "string" &&
        Array.isArray(o.choices) &&
        o.choices.every(
          (c) =>
            c &&
            typeof c.label === "string" &&
            typeof c.priceModifier === "number"
        )
    );
  } catch {
    return [];
  }
}

// List all menu items for this vendor
export async function listMenu(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const items = await MenuItem.find({ vendorId: req.user.vendorId }).sort({
      category: 1,
      name: 1,
    });

    res.json({
      success: true,
      menu: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Create a new menu item (can send image in the form too)
export async function createMenuItem(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const { name, price, category, options, available } = req.body;

    // Check required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file, "campus-cravix/menu-items");
    }

    // Save to database
    const item = await MenuItem.create({
      vendorId: req.user.vendorId,
      name: name.trim(),
      price: priceNum,
      category: category.trim(),
      options: parseOptions(options),
      available: available !== undefined ? (available === true || available === "true") : true,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      menuItem: item,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update an existing menu item (can send new image to replace old one)
export async function updateMenuItem(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const item = await MenuItem.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    const { name, price, category, options, available } = req.body;

    // Update only the fields that were sent
    if (name !== undefined && name !== "") item.name = String(name).trim();
    if (price !== undefined) {
      const priceNum = Number(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: "Invalid price" });
      }
      item.price = priceNum;
    }
    if (category !== undefined && category !== "") item.category = String(category).trim();
    if (options !== undefined) item.options = parseOptions(options);
    if (available !== undefined) item.available = available === true || available === "true";

    if (req.file) {
      if (item.image) await deleteImage(item.image);
      item.image = await uploadImage(req.file, "campus-cravix/menu-items");
    }

    await item.save();

    res.json({
      success: true,
      menuItem: item,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete a menu item and its image from Cloudinary
export async function deleteMenuItem(req, res) {
  try {
    if (!req.user.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found. Please contact admin to set up your stall.",
      });
    }

    const item = await MenuItem.findOne({
      _id: req.params.id,
      vendorId: req.user.vendorId,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    if (item.image) await deleteImage(item.image);

    await MenuItem.deleteOne({ _id: item._id });

    res.json({ success: true, message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
