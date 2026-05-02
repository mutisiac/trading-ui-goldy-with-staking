import type { Request, Response, NextFunction } from "express";
import { findUserById } from "../repositories/user.repository.js";
import { UserStatus } from "../models/user.model.js";

async function checkUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status === UserStatus.DELETED) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deleted.",
      });
    }

    if (user.status === UserStatus.INACTIVE) {
      return res.status(403).json({
        success: false,
        message: "Your account is frozen. Contact support.",
      });
    }

    next();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
}

export default checkUserStatus;
