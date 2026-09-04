import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/shared/AppShell";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { membersQueryOptions } from "@/features/members/api";
import { expiryRelative, expiryTone, formatDate } from "@/features/members/format";
import type {
  Member,
  MemberSort,
  MemberStatusFilter,
} from "@/features/members/types";
import { cn } from "@/lib/utils";

const STATUSES: MemberStatusFilter[] = ["all", "active", "expiring", "expired", "left"];
const STATUS_LABEL: Record<MemberStatusFilter, string> = {
  all: "All",
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  left: "Left gym",
};
const SORTS: MemberSort[] = ["recent", "number", "name", "expiry"];
const SORT_LABEL: Record<MemberSort, string> = {
  recent: "Recently added",
  number: "Member number",
  name: "Name",
  expiry: "Expiry date",
};

export const Route = createFileRoute("/members/")({
  head: () => ({
    meta: [
      { title: "Members — Fitking's Academy" },
      {
        name: "description",
        content:
          "Search, filter and manage every gym member, their membership status and expiry, in one place.",
      },
      { property: "og:title", content: "Members — Fitking's Academy" },
      {
        property: "og:description",
        content: "Search, filter and manage every gym member and membership status.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    status: (STATUSES.includes(search.status as MemberStatusFilter)
      ? search.status
      : "all") as MemberStatusFilter,
    sort: (SORTS.includes(search.sort as MemberSort) ? search.sort : "recent") as MemberSort,
    page: Math.max(1, Number(search.page ?? 1) || 1),
  }),
  component: MembersPage,
});

function MembersPage() {
  const { q, status, sort, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setSearch = (patch: Partial<{ q: string; status: MemberStatusFilter; sort: MemberSort; page: number }>) =>
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, page: 1, ...patch }),
      replace: true,
    });

  const query = useQuery(membersQueryOptions({ q, status, sort, page }));

  return (
    <AppShell>
      <header className="flex flex-wrap items-center justify-between gap-3 pt-6 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.data ? `${query.data.total} in your gym` : "Your gym register"}
          </p>
        </div>
        <Button asChild className="h-11">
          <Link to="/members/new">
            <Plus className="size-4" aria-hidden />
            Add member
          </Link>
        </Button>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setSearch({ q: e.target.value })}
            placeholder="Search by number, name or phone"
            aria-label="Search members"
            className="h-12 pr-10 pl-9 text-base"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setSearch({ q: "" })}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setSearch({ status: s })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                status === s
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
          <div className="ml-auto hidden sm:block">
            <Select value={sort} onValueChange={(v) => setSearch({ sort: v as MemberSort })}>
              <SelectTrigger className="h-10 w-48" aria-label="Sort members">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SORT_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <section className="mt-5">
        {query.isPending ? (
          <ListSkeleton />
        ) : query.isError ? (
          <ErrorState
            title="Couldn't load members"
            body="We couldn't reach your member list. Check your connection and try again."
            onRetry={() => void query.refetch()}
            className="rounded-xl border border-border bg-card"
          />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q || status !== "all" ? "No members found" : "No members yet"}
            body={
              q || status !== "all"
                ? "Try a different number, name or filter."
                : "Add your first member to start replacing the diary."
            }
            action={
              q || status !== "all" ? (
                <Button variant="outline" onClick={() => setSearch({ q: "", status: "all" })}>
                  Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/members/new">
                    <Plus className="size-4" aria-hidden />
                    Add member
                  </Link>
                </Button>
              )
            }
            className="rounded-xl border border-border bg-card"
          />
        ) : (
          <>
            <ul className="space-y-2.5 lg:hidden">
              {query.data.items.map((m) => (
                <li key={m.id}>
                  <MemberCard member={m} />
                </li>
              ))}
            </ul>

            <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Gym members</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th scope="col" className="px-4 py-3 font-medium">No.</th>
                    <th scope="col" className="px-4 py-3 font-medium">Member</th>
                    <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                    <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                    <th scope="col" className="px-4 py-3 font-medium">Expiry</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-accent/60">
                      <td className="px-4 py-3 tabular font-medium">
                        <Link
                          to="/members/$memberId"
                          params={{ memberId: m.id }}
                          className="after:absolute focus-visible:underline"
                        >
                          {m.memberNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/members/$memberId"
                          params={{ memberId: m.id }}
                          className="font-medium hover:underline"
                        >
                          {m.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular text-muted-foreground">{m.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(m.joiningDate)}</td>
                      <td className="px-4 py-3">
                        <ExpiryText member={m} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.displayStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {query.data.totalPages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-5 flex items-center justify-between gap-3"
              >
                <Button
                  variant="outline"
                  disabled={query.data.page <= 1}
                  onClick={() => setSearch({ page: query.data.page - 1 })}
                >
                  Previous
                </Button>
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  Page {query.data.page} of {query.data.totalPages}
                </p>
                <Button
                  variant="outline"
                  disabled={query.data.page >= query.data.totalPages}
                  onClick={() => setSearch({ page: query.data.page + 1 })}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </AppShell>
  );
}

function ExpiryText({ member }: { member: Member }) {
  const text = expiryRelative(member.daysRemaining);
  const tone = expiryTone(member);
  if (!text) return <span className="text-muted-foreground">No membership</span>;
  return (
    <span
      className={cn(
        tone === "warning" && "text-warning",
        tone === "destructive" && "text-destructive",
        tone === "muted" && "text-muted-foreground",
      )}
    >
      {member.daysRemaining !== null && member.daysRemaining < 0 ? "Expired " : "Expires "}
      {text}
    </span>
  );
}

function MemberCard({ member }: { member: Member }) {
  return (
    <Link
      to="/members/$memberId"
      params={{ memberId: member.id }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors active:bg-accent"
    >
      <MemberAvatar name={member.name} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="tabular text-xs font-medium text-muted-foreground">
            {member.memberNumber}
          </span>
        </span>
        <span className="block truncate text-[15px] font-medium">{member.name}</span>
        <span className="mt-0.5 block text-xs">
          <ExpiryText member={member} />
        </span>
      </span>
      <StatusBadge status={member.displayStatus} />
    </Link>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-2.5" aria-busy="true" aria-label="Loading members">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
