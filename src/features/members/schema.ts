import { z } from "zod";

/**
 * Shared validation shape. In production the identical schema is enforced
 * server-side; client validation is only a convenience and the server wins.
 */
export const memberInputSchema = z.object({
  memberNumber: z
    .string()
    .trim()
    .min(1, "Enter the member number")
    .max(10, "Member number can't be longer than 10 characters")
    .regex(/^[0-9A-Za-z-]+$/, "Use only numbers, letters or hyphens"),
  name: z
    .string()
    .trim()
    .min(2, "Enter the member's name")
    .max(80, "Name can't be longer than 80 characters"),
  phone: z
    .string()
    .trim()
    .max(15)
    .refine((v) => v === "" || /^[0-9+\s-]{7,15}$/.test(v), "Enter a valid phone number"),
  joiningDate: z
    .string()
    .min(1, "Enter the joining date")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "Joining date can't be in the future"),
  notes: z.string().trim().max(500, "Notes can't be longer than 500 characters"),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

export const memberEditSchema = memberInputSchema.omit({ memberNumber: true });
export type MemberEditInput = z.infer<typeof memberEditSchema>;
