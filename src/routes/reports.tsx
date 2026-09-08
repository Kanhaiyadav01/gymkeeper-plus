import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, IndianRupee, Users } from "lucide-react";
import { AppShell } from "@/components/shared/AppShell";
import { ErrorState } from "@/components/shared/States";
import { PERIOD_OPTIONS, reportQueryOptions } from "@/features/reports/api";
import { ReportSection } from "@/features/reports/components/ReportSection";
import { formatRupees } from "@/features/memberships/format";
import { formatDate } from "@/features/members/format";
import type { ReportPeriod } from "@/features/reports/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Fitking's Academy" },
      {
        name: "description",
        content:
          "Monthly gym reports: members joined, collection split by cash and UPI, memberships sold and attendance visits.",
      },
      { property: "og:title", content: "Reports — Fitking's Academy" },
      {
        property: "og:description",
        content: "Members, collection and attendance totals for any month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("this_month");
  const report = useQuery(reportQueryOptions(period));
  const data = report.data;
  const pending = report.isPending || !data;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-5 pb-24 lg:pb-8">
        <header>
          <p className="text-sm text-muted-foreground">
            {data ? `${formatDate(data.from)} – ${formatDate(data.to)}` : "Summary"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        </header>

        <div
          role="group"
          aria-label="Report period"
          className="mt-4 grid grid-cols-3 gap-2"
        >
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                "h-11 rounded-lg border text-sm font-medium transition-colors",
                period === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {report.isError ? (
          <div className="mt-4">
            <ErrorState
              body="We couldn't load this report."
              onRetry={() => void report.refetch()}
              className="rounded-xl border border-border bg-card"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <ReportSection
              title={`Members · ${data?.periodLabel ?? ""}`}
              icon={Users}
              isPending={pending}
              rows={[
                { label: "On the books", value: String(data?.members.total ?? 0) },
                { label: "Active now", value: String(data?.members.active ?? 0) },
                { label: "Joined", value: String(data?.members.joined ?? 0) },
                { label: "Left gym", value: String(data?.members.leftGym ?? 0) },
              ]}
            />

            <ReportSection
              title="Collection"
              icon={IndianRupee}
              isPending={pending}
              rows={[
                { label: "Collected", value: formatRupees(data?.collection.total ?? 0) },
                { label: "Cash", value: formatRupees(data?.collection.cash ?? 0) },
                { label: "UPI", value: formatRupees(data?.collection.upi ?? 0) },
                { label: "Payments", value: String(data?.collection.paymentCount ?? 0) },
                {
                  label: "Memberships sold",
                  value: String(data?.collection.membershipsSold ?? 0),
                },
              ]}
            />

            <ReportSection
              title="Attendance"
              icon={CalendarCheck}
              isPending={pending}
              rows={[
                { label: "Visits", value: String(data?.attendance.visits ?? 0) },
                { label: "Members seen", value: String(data?.attendance.uniqueMembers ?? 0) },
                { label: "Average a day", value: String(data?.attendance.averagePerDay ?? 0) },
              ]}
            />

            <p className="text-xs text-muted-foreground">
              Voided payments are left out of every total.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
