import type { Request, Response, NextFunction } from "express";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.utils.js";

export async function uploadUserImageToCloudinary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      next();
      return;
    }

    if (!req.file.mimetype.startsWith("image/")) {
      res.status(400).json({
        success: false,
        message: "Invalid file type. Only images are allowed.",
      });
      return;
    }

    const userId = req.user?._id ?? "bootstrap";
    const timestamp = Date.now();
    const publicId = `user-${userId}-${timestamp}`;

    const cloudinaryUrl = await uploadToCloudinary(
      req.file.path,
      "whatsapp-campaign/users",
      publicId,
      "image"
    );

    req.file.path = cloudinaryUrl;

    next();
  } catch (error: unknown) {
    console.error("Upload to Cloudinary middleware error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({
      success: false,
      message: "Failed to upload image to cloud storage",
      error: message,
    });
  }
}

export async function uploadCampaignFileToCloudinary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      next();
      return;
    }

    const userId = req.user?._id ?? "unknown";
    const timestamp = Date.now();
    const campaignName =
      typeof req.body.campaignName === "string"
        ? req.body.campaignName.replace(/\s+/g, "-").toLowerCase()
        : "campaign";
    const publicId = `${campaignName}-${userId}-${timestamp}`;

    let cloudinaryUrl: string;

    if (req.file.mimetype.startsWith("image/")) {
      cloudinaryUrl = await uploadToCloudinary(
        req.file.path,
        "whatsapp-campaign/campaigns",
        publicId,
        "image"
      );
    } else {
      res.status(400).json({
        success: false,
        message:
          "Only images are currently supported. Videos and PDFs coming soon!",
      });
      return;
    }

    req.file.path = cloudinaryUrl;
    req.body.fileUrl = cloudinaryUrl;

    next();
  } catch (error: unknown) {
    console.error("Upload campaign file to Cloudinary error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({
      success: false,
      message: "Failed to upload file to cloud storage",
      error: message,
    });
  }
}

export async function deleteOldUserImage(oldImageUrl: string): Promise<void> {
  try {
    if (oldImageUrl && oldImageUrl.includes("cloudinary.com")) {
      await deleteFromCloudinary(oldImageUrl, "image");
    }
  } catch (error) {
    console.error("Error deleting old image:", error);
  }
}
