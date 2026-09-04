import { z } from "zod";

/** Mirrors the server-side schema; the server always revalidates. */
export const renewSchema = z.object({
  durationMonths: z.union([z.literal(1), z.literal(3)]),
  renewalDate: z
    .string()
    .min(1, "Choose the renewal date")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "Renewal date can't be in the future"),
  amount: z
    .number({ message: "Enter the amount collected" })
    .int("Enter a whole rupee amount")
    .positive("Amount must be greater than zero")
    .max(1_000_000, "That amount looks too large"),
  paymentMethod: z.union([z.literal("CASH"), z.literal("UPI")]),
});

export type RenewFormInput = z.infer<typeof renewSchema>;

export const paymentAmountSchema = z
  .number({ message: "Enter the corrected amount" })
  .int("Enter a whole rupee amount")
  .positive("Amount must be greater than zero")
  .max(1_000_000, "That amount looks too large");

/** Extension point: future plans (2 / 6 / 12 months, custom) are added here. */
export const DURATION_OPTIONS = [
  { months: 1 as const, label: "1 month", defaultAmount: 1000 },
  { months: 3 as const, label: "3 months", defaultAmount: 2500 },
];
