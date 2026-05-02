import { z } from "zod";

export const supportFormBodySchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  message: z.string().min(1),
  email: z.string().email(),
  number: z.string().min(5).max(30),
});

export type SupportFormBody = z.infer<typeof supportFormBodySchema>;
