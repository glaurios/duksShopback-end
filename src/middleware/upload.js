import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Ensure uploads folder exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 'uploads' folder created automatically");
}

// ✅ Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Folder where images will be stored
  },
  filename: function (req, file, cb) {
    const uniqueName =
      file.fieldname + "-" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// ✅ File filter (only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Only .jpeg, .jpg, and .png files are allowed"), false);
  }
};

// ✅ Export upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

export default upload;
