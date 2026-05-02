import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { env } from "../config/env.js";

const windowMs =
  env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000;
const max = env.RATE_LIMIT_MAX_REQUESTS ?? 100;

export const loginLimiter = rateLimit({
  windowMs,
  max,
  message: {
    error: "Too many requests from this IP address",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests from this IP address",
      retryAfter: (
        req as Request & { rateLimit?: { resetTime?: Date } }
      ).rateLimit?.resetTime,
    });
  },
});
