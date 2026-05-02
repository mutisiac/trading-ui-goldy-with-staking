import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { env } from "../config/env.js";
import type { UserRole } from "../models/user.model.js";

export interface TokenUserInput {
  _id: Types.ObjectId | string;
  email: string;
  role: UserRole;
}

export function generateToken(user: TokenUserInput): string {
  const payload = {
    id: typeof user._id === "string" ? user._id : user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}
