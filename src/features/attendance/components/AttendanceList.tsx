import { Link } from "@tanstack/react-router";
import { Clock, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { formatMarkedTime } from "../format";
import type { AttendanceRecord } from "../types";

interface AttendanceListProps {
  records: AttendanceRecord[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onUndo: (attendanceId: string) => void;
  undoing: boolean;
}

export function AttendanceList({
  records,
  isPending,
  isError,
  onRetry,
  onUndo,
  undoing,
}: AttendanceListProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Marked present today</h2>
        {records ? (
          <span className="text-xs tabular-nums text-muted-foreground">{records.length}</span>
        ) : null}
      </header>

      {isError ? (
        <ErrorState body="We couldn't load today's attendance." onRetry={onRetry} />
      ) : isPending ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !records?.length ? (
        <EmptyState
          icon={Clock}
          title="No one marked yet"
          body="Enter a member number above to mark the first attendance of the day."
        />
      ) : (
        <ul className="divide-y divide-border">
          {records.map((record) => (
            <li key={record.id} className="flex items-center gap-3 px-4 py-3">
              <MemberAvatar name={record.memberName} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to="/members/$memberId"
                  params={{ memberId: record.memberId }}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {record.memberName}
                </Link>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {record.memberNumber} · {formatMarkedTime(record.markedAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={undoing}
                onClick={() => onUndo(record.id)}
                aria-label={`Undo attendance for ${record.memberName}`}
              >
                <Undo2 className="size-4" aria-hidden />
                <span className="hidden sm:inline">Undo</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
