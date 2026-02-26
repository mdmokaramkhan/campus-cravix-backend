import cloudinary from "../config/cloudinary.js";

export async function uploadImage(file, folder) {
  if (!file?.buffer || !folder) {
    throw new Error("File and folder are required");
  }

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
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
