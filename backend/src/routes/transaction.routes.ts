import express from "express";
import upload from "../utils/upload.utils.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import hasAuthority from "../middleware/role.middleware.js";
import { creditBalance, debitBalance } from "../controllers/transaction.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  creditBalanceBodySchema,
  debitBalanceBodySchema,
} from "../validation/transaction.schemas.js";

const router = express.Router();

router.post(
  "/credit",
  isLoggedIn,
  hasAuthority,
  upload.none(),
  validateBody(creditBalanceBodySchema),
  creditBalance
);
router.post(
  "/debit",
  isLoggedIn,
  hasAuthority,
  upload.none(),
  validateBody(debitBalanceBodySchema),
  debitBalance
);

export default router;
