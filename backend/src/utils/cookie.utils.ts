import type { Response } from "express";
import { env } from "../config/env.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: THIRTY_DAYS_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  });
}
