import type { Request, Response, NextFunction } from "express";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);
  const message =
    err instanceof Error ? err.message : "An internal server error occurred.";
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message,
    });
  }
}
