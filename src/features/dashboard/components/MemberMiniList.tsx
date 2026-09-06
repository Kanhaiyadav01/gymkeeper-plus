import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { expiryRelative } from "@/features/members/format";
import type { Member } from "@/features/members/types";

export interface MemberMiniListProps {
  title: string;
  emptyText: string;
  members: Member[];
  isPending: boolean;
  showStatus?: boolean;
  action?: React.ReactNode;
}

export function MemberMiniList({
  title,
  emptyText,
  members,
  isPending,
  showStatus = true,
  action,
}: MemberMiniListProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>

      {isPending ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <Link
                to="/members/$memberId"
                params={{ memberId: m.id }}
                className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <MemberAvatar name={m.name} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.memberNumber} · {expiryRelative(m.daysRemaining) ?? "no membership"}
                  </span>
                </span>
                {showStatus ? <StatusBadge status={m.displayStatus} /> : null}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
