import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "rv-gift-products",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }], // ✅ Auto optimize
    }),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        // ✅ Only images allowed
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
});

export default upload;