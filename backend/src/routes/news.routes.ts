import express from "express";
import {
  createNews,
  updateNews,
  deleteNews,
} from "../controllers/news.controller.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import isAdmin from "../middleware/is-admin.middleware.js";
import upload from "../utils/upload.utils.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import {
  createNewsBodySchema,
  updateNewsBodySchema,
} from "../validation/news.schemas.js";
import { newsIdParamSchema } from "../validation/auth.schemas.js";

const router = express.Router();

router.post(
  "/create",
  isLoggedIn,
  isAdmin,
  upload.none(),
  validateBody(createNewsBodySchema),
  createNews
);
router.put(
  "/update/:newsId",
  isLoggedIn,
  isAdmin,
  upload.none(),
  validateParams(newsIdParamSchema),
  validateBody(updateNewsBodySchema),
  updateNews
);
router.delete(
  "/delete/:newsId",
  isLoggedIn,
  isAdmin,
  upload.none(),
  validateParams(newsIdParamSchema),
  deleteNews
);

export default router;
