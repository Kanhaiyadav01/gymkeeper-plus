import { Link } from "@tanstack/react-router";
import { CreditCard, PauseCircle, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { expiryRelative, formatDate } from "@/features/members/format";
import type { Member } from "@/features/members/types";

interface Props {
  member: Member;
  busy: boolean;
  onKeepInactive: () => void;
  onMarkLeft: () => void;
  onRenew: () => void;
}

export function ReviewCard({ member, busy, onKeepInactive, onMarkLeft, onRenew }: Props) {
  const expired = expiryRelative(member.daysRemaining);

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <MemberAvatar name={member.name} />
        <div className="min-w-0 flex-1">
          <p className="tabular text-xs font-medium text-muted-foreground">
            {member.memberNumber}
          </p>
          <Link
            to="/members/$memberId"
            params={{ memberId: member.id }}
            className="block truncate text-base font-semibold hover:underline"
          >
            {member.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={member.displayStatus} />
            <span className="text-xs text-muted-foreground">
              {member.currentMembership
                ? `Ended ${formatDate(member.currentMembership.endDate)}`
                : "No membership recorded"}
              {expired ? ` · expired ${expired}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button className="h-11" disabled={busy} onClick={onRenew}>
          <CreditCard className="size-4" aria-hidden />
          Renew
        </Button>
        <Button variant="outline" className="h-11" disabled={busy} onClick={onKeepInactive}>
          <PauseCircle className="size-4" aria-hidden />
          Keep inactive
        </Button>
        <Button variant="outline" className="h-11" disabled={busy} onClick={onMarkLeft}>
          <UserMinus className="size-4" aria-hidden />
          Mark left gym
        </Button>
      </div>
    </article>
  );
}
