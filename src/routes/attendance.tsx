import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/AppShell";
import { attendanceApi, attendanceTodayQueryOptions } from "@/features/attendance/api";
import { AttendanceList } from "@/features/attendance/components/AttendanceList";
import { MarkAttendanceCard } from "@/features/attendance/components/MarkAttendanceCard";
import { formatDate } from "@/features/members/format";
import { todayISO } from "@/features/members/format";
import type { Member } from "@/features/members/types";
import { ApiClientError } from "@/lib/api/mock-store";
import { getTenantContext } from "@/lib/api/tenant";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Fitking's Academy" },
      {
        name: "description",
        content:
          "Mark daily gym attendance by member number and see everyone who has checked in today.",
      },
      { property: "og:title", content: "Attendance — Fitking's Academy" },
      {
        property: "og:description",
        content: "Fast daily check-in by member number, with today's attendance list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const tenant = getTenantContext();
  const queryClient = useQueryClient();
  const [found, setFound] = useState<Member | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const today = useQuery(attendanceTodayQueryOptions());

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["attendance"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const search = useMutation({
    mutationFn: (memberNumber: string) => attendanceApi.findMemberByNumber(memberNumber),
    onSuccess: (member) => {
      setFound(member);
      setErrorText(null);
    },
    onError: (error) => {
      setFound(null);
      setErrorText(
        error instanceof ApiClientError ? error.message : "We couldn't look up that number.",
      );
    },
  });

  const mark = useMutation({
    mutationFn: (member: Member) => attendanceApi.mark(member.id),
    onSuccess: async (record) => {
      await invalidate();
      setFound(null);
      setErrorText(null);
      toast.success(`${record.memberName} marked present`);
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiClientError ? error.message : "Couldn't mark this attendance.",
      ),
  });

  const undo = useMutation({
    mutationFn: (attendanceId: string) => attendanceApi.unmark(attendanceId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Attendance removed");
    },
    onError: () => toast.error("Couldn't remove that attendance."),
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-5 pb-24 lg:pb-8">
        <header>
          <p className="text-sm text-muted-foreground">{tenant.gymName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(todayISO())}</p>
        </header>

        <div className="mt-4 space-y-4">
          <MarkAttendanceCard
            found={found}
            searching={search.isPending}
            marking={mark.isPending}
            errorText={errorText}
            onSearch={(memberNumber) => search.mutate(memberNumber)}
            onMark={(member) => mark.mutate(member)}
            onClear={() => {
              setFound(null);
              setErrorText(null);
            }}
          />

          <AttendanceList
            records={today.data}
            isPending={today.isPending}
            isError={today.isError}
            onRetry={() => void today.refetch()}
            onUndo={(id) => undo.mutate(id)}
            undoing={undo.isPending}
          />
        </div>
      </div>
    </AppShell>
  );
}
