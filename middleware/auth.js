import jwt from "jsonwebtoken";

// Check if user is logged in (has a valid token in the header)
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = header.split(" ")[1]; // "Bearer xyz123" → "xyz123"

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "JWT config missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
      vendorId: decoded.vendorId || null,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// Make sure user is a vendor (block students from vendor routes)
export function requireVendor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required" });
  }
  if (req.user.role !== "vendor") {
    return res.status(403).json({ success: false, message: "Vendor access only" });
  }
  next();
}

// Make sure user is a student (block vendors from student routes)
export function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required" });
  }
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Student access only" });
  }
  next();
}
