import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user.model.js";

function hasAuthority(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (
    req.user.role === UserRole.ADMIN ||
    req.user.role === UserRole.RESELLER
  ) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: "You don't have the authority to perform this action",
  });
}

export default hasAuthority;
