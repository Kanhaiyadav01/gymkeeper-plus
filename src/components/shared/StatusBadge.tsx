import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { MemberDisplayStatus } from "@/features/members/types";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        active: "border-transparent bg-success-soft text-success",
        expiring: "border-transparent bg-warning-soft text-warning",
        expired: "border-transparent bg-destructive-soft text-destructive",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const dot = {
  active: "bg-success",
  expiring: "bg-warning",
  expired: "bg-destructive",
  neutral: "bg-muted-foreground",
} as const;

const MAP: Record<
  MemberDisplayStatus,
  { label: string; tone: NonNullable<VariantProps<typeof badge>["tone"]> }
> = {
  ACTIVE: { label: "Active", tone: "active" },
  EXPIRING: { label: "Expiring", tone: "expiring" },
  EXPIRED: { label: "Expired", tone: "expired" },
  LEFT_GYM: { label: "Left gym", tone: "neutral" },
  NO_MEMBERSHIP: { label: "No membership", tone: "neutral" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: MemberDisplayStatus;
  className?: string;
}) {
  const { label, tone } = MAP[status];
  return (
    <span className={cn(badge({ tone }), className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", dot[tone])} />
      {label}
    </span>
  );
}
