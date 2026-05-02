import express from "express";
import { supportForm } from "../controllers/support.controller.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import upload from "../utils/upload.utils.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { supportFormBodySchema } from "../validation/support.schemas.js";

const router = express.Router();

router.post(
  "/",
  isLoggedIn,
  upload.none(),
  validateBody(supportFormBodySchema),
  supportForm
);

export default router;
