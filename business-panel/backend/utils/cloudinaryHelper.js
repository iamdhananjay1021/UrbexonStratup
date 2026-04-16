import { uploadToCloudinary as _upload } from "../config/cloudinary.js";

export const uploadToCloudinary = async (file, folder) => {
    if (!file?.buffer) return null;
    return _upload(file.buffer, folder);
};
