import { z } from "zod";
import { UserRole } from "../models/user.model.js";

export const createUserBodySchema = z.object({
  companyName: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(1),
  number: z.coerce.number().int().positive(),
  role: z.nativeEnum(UserRole),
  balance: z.coerce.number().finite().nonnegative(),
  imageUrl: z.string().url().optional(),
});

export const changePasswordBodySchema = z.object({
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
});

export const changeOwnPasswordBodySchema = z.object({
  newPassword: z.string().min(4),
  confirmPassword: z.string().min(1),
});

export const updateUserBodySchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  number: z.coerce.number().int().positive().optional(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type ChangeOwnPasswordBody = z.infer<typeof changeOwnPasswordBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
