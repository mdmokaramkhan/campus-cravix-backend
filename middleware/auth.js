import jwt from "jsonwebtoken";


export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = header.split(" ")[1]; // get part after "Bearer "

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

// Check if user is a vendor
export function requireVendor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required" });
  }
  if (req.user.role !== "vendor") {
    return res.status(403).json({ success: false, message: "Vendor access only" });
  }
  next();
}

// Check if user is a student
export function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required" });
  }
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Student access only" });
  }
  next();
}
