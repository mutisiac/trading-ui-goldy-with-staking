import { Router } from "express";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import upload, { multerErrorHandler } from "../utils/upload.utils.js";
import {
  createComplaint,
  deleteComplaint,
  updateComplaint,
} from "../controllers/complaint.controller.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import {
  createComplaintBodySchema,
  updateComplaintBodySchema,
} from "../validation/complaint.schemas.js";
import { complaintIdParamSchema } from "../validation/auth.schemas.js";

const router = Router();

router.post(
  "/create",
  isLoggedIn,
  upload.none(),
  validateBody(createComplaintBodySchema),
  createComplaint,
  multerErrorHandler
);
router.delete(
  "/delete/:complaintId",
  isLoggedIn,
  validateParams(complaintIdParamSchema),
  deleteComplaint,
  multerErrorHandler
);
router.put(
  "/update/:complaintId",
  isLoggedIn,
  upload.none(),
  validateParams(complaintIdParamSchema),
  validateBody(updateComplaintBodySchema),
  updateComplaint,
  multerErrorHandler
);

export default router;
