import cloudinary from "../config/cloudinary.js";

// Upload image to Cloudinary. Give it the file and folder name. Returns the image URL.
export async function uploadImage(file, folder) {
  if (!file || !file.buffer) {
    throw new Error("File is required for upload");
  }
  if (!folder || typeof folder !== "string") {
    throw new Error("Folder name is required");
  }

  try {
    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });

    return result.secure_url;
  } catch (err) {
    throw new Error(err.message || "Failed to upload image to Cloudinary");
  }
}

// Delete image from Cloudinary using its URL
export async function deleteImage(url) {
  if (!url) return;

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    throw new Error(err.message || "Failed to delete image from Cloudinary");
  }
}

// Cloudinary URLs look like: .../v123/folder/image.jpg - we need "folder/image" to delete
function getPublicIdFromUrl(url) {
  const match = url.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}
