import { CalendarCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { formatDate } from "@/features/members/format";
import { formatMarkedTime } from "../format";
import type { AttendanceRecord } from "../types";

interface AttendanceHistoryProps {
  records: AttendanceRecord[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function AttendanceHistory({
  records,
  isPending,
  isError,
  onRetry,
}: AttendanceHistoryProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Attendance</h2>
        {records?.length ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {records.length} recent visits
          </span>
        ) : null}
      </header>

      {isError ? (
        <ErrorState body="We couldn't load attendance for this member." onRetry={onRetry} />
      ) : isPending ? (
        <div className="space-y-3 p-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : !records?.length ? (
        <EmptyState
          icon={CalendarCheck}
          title="No visits recorded"
          body="Attendance marked on the attendance screen will show up here."
        />
      ) : (
        <ul className="divide-y divide-border">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{formatDate(record.attendanceDate)}</span>
              <span className="text-xs text-muted-foreground">
                {formatMarkedTime(record.markedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
