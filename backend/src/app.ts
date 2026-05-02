import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { multerErrorHandler } from "./utils/upload.utils.js";
import { loginLimiter } from "./middleware/rate-limiter.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import newsRoutes from "./routes/news.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import supportRoutes from "./routes/support.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  const corsOrigin = env.CORS_ORIGIN?.trim();
  app.use(
    cors({
      origin: corsOrigin && corsOrigin.length > 0 ? corsOrigin : true,
      credentials: true,
    })
  );

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });

  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: true, limit: "16kb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "..", "public", "uploads"))
  );
  app.use(cookieParser());
  app.use(loginLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/transaction", transactionRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/support", supportRoutes);

  app.use(multerErrorHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
