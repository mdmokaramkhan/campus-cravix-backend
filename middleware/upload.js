import multer from "multer";

// Keep file in memory instead of saving to disk
const storage = multer.memoryStorage();

// Only allow image files (JPEG, PNG, WebP)
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: JPEG, PNG, WebP"), false);
  }
};

const multerConfig = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

// Middleware to handle a single file upload (pass the form field name, e.g. "image")
export const uploadSingle = (fieldName) => (req, res, next) => {
  multerConfig.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB",
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
