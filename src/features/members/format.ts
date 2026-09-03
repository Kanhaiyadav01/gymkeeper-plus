import { format, parseISO } from "date-fns";
import type { Member } from "./types";

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMM yyyy");
}

/** Human relative expiry, derived from the server-computed daysRemaining. */
export function expiryRelative(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return "expires today";
  if (days === 1) return "in 1 day";
  if (days > 0 && days < 45) return `in ${days} days`;
  if (days >= 45) return `in ${Math.round(days / 30)} months`;
  const ago = Math.abs(days);
  if (ago === 1) return "1 day ago";
  if (ago < 45) return `${ago} days ago`;
  return `${Math.round(ago / 30)} months ago`;
}

export function expiryTone(member: Member): "muted" | "warning" | "destructive" {
  if (member.displayStatus === "EXPIRING") return "warning";
  if (member.displayStatus === "EXPIRED") return "destructive";
  return "muted";
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
