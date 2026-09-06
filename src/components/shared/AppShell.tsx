import { Link, useRouterState } from "@tanstack/react-router";
import { Clock, Dumbbell, LayoutDashboard, LogOut, Users } from "lucide-react";
import { getTenantContext } from "@/lib/api/tenant";
import { MemberAvatar } from "./MemberAvatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { to: "/members", label: "Members", icon: Users, enabled: true },
  { to: "/attendance", label: "Attendance", icon: Clock, enabled: false },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tenant = getTenantContext();
  const isMembers = pathname.startsWith("/members");
  const isActive = (to: string) => (to === "/members" ? isMembers : pathname.startsWith(to));
  const membersSearch = { q: "", status: "all", sort: "recent", page: 1 } as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="size-4.5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Fitking's</span>
            <span className="block text-[11px] tracking-[0.18em] text-muted-foreground">
              ACADEMY
            </span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main">
          {NAV.map((item) =>
            item.enabled ? (
              <Link
                key={item.to}
                to={item.to}
                {...(item.to === "/members" ? { search: membersSearch } : {})}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="size-4.5" aria-hidden />
                {item.label}
              </Link>
            ) : (
              <span
                key={item.to}
                aria-disabled="true"
                title="Available in a later phase"
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground/55"
              >
                <item.icon className="size-4.5" aria-hidden />
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="m-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2.5">
            <MemberAvatar name={tenant.userName} size="sm" />
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] text-muted-foreground">Trainer</span>
              <span className="block truncate text-sm font-medium">{tenant.userName}</span>
            </span>
          </div>
          <button
            type="button"
            aria-disabled="true"
            className="mt-3 flex w-full cursor-not-allowed items-center gap-2 rounded-md px-1 py-1.5 text-sm text-muted-foreground/70"
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-3">
          {NAV.map((item) => (
            <li key={item.to}>
              {item.enabled ? (
                <Link
                  to={item.to}
                  {...(item.to === "/members" ? { search: membersSearch } : {})}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    isActive(item.to)
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex h-16 cursor-not-allowed flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground/50"
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
