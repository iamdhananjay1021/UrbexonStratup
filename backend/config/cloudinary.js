import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

// ── Upload single buffer ──────────────────────────────────────
export const uploadToCloudinary = (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `urbexon/vendors/${folder}`, resource_type: "auto", quality: "auto", fetch_format: "auto", ...options },
            (err, result) => { if (err) return reject(err); resolve(result.secure_url); }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// ── Upload documents ──────────────────────────────────────────
export const uploadDocuments = async (files = {}) => {
    const uploaded = {};
    const docFields = ["shopPhoto", "ownerPhoto", "gstCertificate", "panCard", "cancelledCheque", "addressProof"];
    await Promise.all(docFields.map(async (field) => {
        if (files[field]?.[0]) uploaded[field] = await uploadToCloudinary(files[field][0].buffer, "documents");
    }));
    return uploaded;
};

// ── Upload logo ───────────────────────────────────────────────
export const uploadLogo = async (files = {}) => {
    if (!files.shopLogo?.[0]) return null;
    return uploadToCloudinary(files.shopLogo[0].buffer, "logos", { width: 400, height: 400, crop: "fill" });
};

// ── Upload banner ─────────────────────────────────────────────
export const uploadBanner = async (files = {}) => {
    if (!files.shopBanner?.[0]) return null;
    return uploadToCloudinary(files.shopBanner[0].buffer, "banners", { width: 1200, height: 400, crop: "fill" });
};

export default cloudinary; 