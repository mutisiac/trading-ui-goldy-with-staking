import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "../config/env.js";

function ensureCloudinaryConfigured(): void {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    console.error(
      "Cloudinary environment variables are not set properly. Exiting."
    );
    process.exit(1);
  }
}

ensureCloudinaryConfigured();

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  localFilePath: string,
  folder: string,
  publicId?: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<string> {
  if (!localFilePath) {
    throw new Error("Local file path is required");
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      folder,
      public_id: publicId,
      resource_type: resourceType,
      ...(resourceType === "image" && {
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      }),
    });

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return uploadResult.secure_url;
  } catch (error: unknown) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload to Cloudinary: ${message}`);
  }
}

export async function deleteFromCloudinary(
  imageUrl: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  try {
    if (!imageUrl) return;

    const urlParts = imageUrl.split("/upload/");
    if (urlParts.length < 2) return;

    const pathWithVersion = urlParts[1];
    const pathParts = pathWithVersion.split("/");
    pathParts.shift();

    const publicIdWithExtension = pathParts.join("/");
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error: unknown) {
    console.error("Cloudinary delete error:", error);
  }
}

export default cloudinary;
