import type { PaymentMethod } from "./types";

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function methodLabel(method: PaymentMethod): string {
  return method === "CASH" ? "Cash" : "UPI";
}
