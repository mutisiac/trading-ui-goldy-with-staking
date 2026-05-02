import { z } from "zod";

export const createNewsBodySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const updateNewsBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreateNewsBody = z.infer<typeof createNewsBodySchema>;
export type UpdateNewsBody = z.infer<typeof updateNewsBodySchema>;
