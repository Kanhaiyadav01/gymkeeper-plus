import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  IndianRupee,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/shared/AppShell";
import { ErrorState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardQueryOptions } from "@/features/dashboard/api";
import { MemberMiniList } from "@/features/dashboard/components/MemberMiniList";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { formatRupees } from "@/features/memberships/format";
import { getTenantContext } from "@/lib/api/tenant";

const MEMBERS_SEARCH = { q: "", status: "all", sort: "recent", page: 1 } as const;

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fitking's Academy" },
      {
        name: "description",
        content:
          "Daily action centre for the gym: member counts, memberships expiring soon, expired members needing review, and this month's collection.",
      },
      { property: "og:title", content: "Dashboard — Fitking's Academy" },
      {
        property: "og:description",
        content: "Member counts, expiring memberships and collection at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const tenant = getTenantContext();
  const dashboard = useQuery(dashboardQueryOptions());
  const data = dashboard.data;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-5 pb-24 lg:pb-8">
        <header>
          <p className="text-sm text-muted-foreground">{tenant.gymName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Today at a glance</h1>
        </header>

        {dashboard.isError ? (
          <div className="mt-4">
            <ErrorState
              message="We couldn't load today's summary."
              onRetry={() => void dashboard.refetch()}
            />
          </div>
        ) : (
          <>
            <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {dashboard.isPending || !data ? (
                [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
              ) : (
                <>
                  <StatCard label="Members" value={data.counts.total} icon={Users} />
                  <StatCard label="Active" value={data.counts.active} icon={Users} />
                  <StatCard
                    label="Expiring soon"
                    value={data.counts.expiring}
                    icon={CalendarClock}
                    tone="warning"
                  />
                  <StatCard
                    label="Expired"
                    value={data.counts.expired}
                    icon={AlertTriangle}
                    tone="danger"
                  />
                </>
              )}
            </section>

            <section className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="size-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-semibold">Collected this month</h2>
              </div>
              {dashboard.isPending || !data ? (
                <Skeleton className="mt-3 h-9 w-40" />
              ) : (
                <>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {formatRupees(data.collection.monthTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRupees(data.collection.monthCash)} cash ·{" "}
                    {formatRupees(data.collection.monthUpi)} UPI
                  </p>
                </>
              )}
            </section>

            <section className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12 justify-start">
                <Link to="/members/new">
                  <UserPlus className="size-4" aria-hidden />
                  Add member
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 justify-start">
                <Link to="/members" search={{ ...MEMBERS_SEARCH, status: "expiring" }}>
                  <CalendarClock className="size-4" aria-hidden />
                  Renewals due
                </Link>
              </Button>
            </section>

            <div className="mt-4 space-y-4">
              <MemberMiniList
                title="Expiring in the next 7 days"
                emptyText="No memberships are ending this week."
                members={data?.expiringSoon ?? []}
                isPending={dashboard.isPending}
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/members" search={{ ...MEMBERS_SEARCH, status: "expiring" }}>
                      See all
                    </Link>
                  </Button>
                }
              />

              <MemberMiniList
                title="Recently expired"
                emptyText="Nothing has expired recently."
                members={data?.recentlyExpired ?? []}
                isPending={dashboard.isPending}
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/members" search={{ ...MEMBERS_SEARCH, status: "expired" }}>
                      See all
                    </Link>
                  </Button>
                }
              />

              <MemberMiniList
                title={`Needs review${data?.needsReviewCount ? ` (${data.needsReviewCount})` : ""}`}
                emptyText="No one has been expired for three months or more."
                members={data?.needsReview ?? []}
                isPending={dashboard.isPending}
                action={
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClipboardList className="size-3.5" aria-hidden />
                    3+ months expired
                  </span>
                }
              />

              <MemberMiniList
                title="Recently added"
                emptyText="No members yet."
                members={data?.recentMembers ?? []}
                isPending={dashboard.isPending}
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/members" search={MEMBERS_SEARCH}>
                      All members
                    </Link>
                  </Button>
                }
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
