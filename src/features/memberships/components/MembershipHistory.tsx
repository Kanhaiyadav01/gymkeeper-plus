import { CalendarRange } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/States";
import { formatDate } from "@/features/members/format";
import type { Membership } from "../types";

interface Props {
  memberships: Membership[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function MembershipHistory({ memberships, isPending, isError, onRetry }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-base font-semibold">Membership history</h2>

      {isPending ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load memberships"
          body="Check your connection and try again."
          onRetry={onRetry}
          className="mt-4"
        />
      ) : !memberships?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No membership recorded yet. Renewing creates the first one.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
            >
              <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {formatDate(m.startDate)} – {formatDate(m.endDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.durationMonths === 1 ? "1 month" : `${m.durationMonths} months`}
                  {m.isCurrent ? " · current" : ""}
                </p>
              </div>
              {m.isCurrent && m.isActive ? (
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                  Running
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
