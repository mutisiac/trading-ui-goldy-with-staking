import { z } from "zod";
import { ComplaintStatus } from "../models/complaint.model.js";

export const createComplaintBodySchema = z.object({
  subject: z
    .string()
    .min(1)
    .max(500)
    .refine(
      (s) => {
        const words = s.trim().split(/\s+/).filter(Boolean).length;
        return words >= 1 && words <= 30;
      },
      { message: "Subject must be between 1 and 30 words" }
    ),
  description: z.string().min(10).max(2000),
});

export const updateComplaintBodySchema = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  adminResponse: z.string().max(2000).optional(),
});

export type CreateComplaintBody = z.infer<typeof createComplaintBodySchema>;
export type UpdateComplaintBody = z.infer<typeof updateComplaintBodySchema>;
