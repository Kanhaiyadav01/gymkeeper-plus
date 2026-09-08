import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/AppShell";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard } from "@/features/lifecycle/components/ReviewCard";
import { lifecycleApi, needsReviewQueryOptions } from "@/features/lifecycle/api";
import { RenewSheet } from "@/features/memberships/components/RenewSheet";
import { membershipsApi } from "@/features/memberships/api";
import type { RenewInput } from "@/features/memberships/types";
import type { Member } from "@/features/members/types";
import { ApiClientError } from "@/lib/api/mock-store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Needs review — Fitking's Academy" },
      {
        name: "description",
        content:
          "Members whose membership expired three months ago or more: renew them, park them, or mark them as left the gym.",
      },
      { property: "og:title", content: "Needs review — Fitking's Academy" },
      {
        property: "og:description",
        content: "Decide what to do with long-expired members without losing any history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const queryClient = useQueryClient();
  const review = useQuery(needsReviewQueryOptions());
  const [renewFor, setRenewFor] = useState<Member | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["needs-review"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  };

  const fail = (error: unknown, fallback: string) =>
    toast.error(error instanceof ApiClientError ? error.message : fallback);

  const keepInactive = useMutation({
    mutationFn: (memberId: string) => lifecycleApi.keepInactive(memberId),
    onSuccess: async (member) => {
      await refresh();
      toast.success(`${member.name} kept inactive — nothing was changed`);
    },
    onError: (e) => fail(e, "Couldn't park this member."),
  });

  const markLeft = useMutation({
    mutationFn: (memberId: string) => lifecycleApi.setLifecycle(memberId, "LEFT_GYM"),
    onSuccess: async (member) => {
      await refresh();
      toast.success(`${member.name} marked as left gym — all records kept`);
    },
    onError: (e) => fail(e, "Couldn't update this member."),
  });

  const renew = useMutation({
    mutationFn: ({ memberId, input }: { memberId: string; input: RenewInput }) =>
      membershipsApi.renew(memberId, input),
    onSuccess: async () => {
      await refresh();
      if (renewFor) {
        await queryClient.invalidateQueries({ queryKey: ["member", renewFor.id] });
      }
      setRenewFor(null);
      toast.success("Membership renewed and payment recorded");
    },
    onError: (e) => fail(e, "Couldn't renew this membership."),
  });

  const busy = keepInactive.isPending || markLeft.isPending || renew.isPending;
  const items = review.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-5 pb-24 lg:pb-8">
        <header>
          <p className="text-sm text-muted-foreground">Lifecycle</p>
          <h1 className="text-2xl font-semibold tracking-tight">Needs review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Members expired for three months or more. Nothing happens automatically — you decide.
          </p>
        </header>

        <div className="mt-5 space-y-3">
          {review.isPending ? (
            [0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)
          ) : review.isError ? (
            <ErrorState
              body="We couldn't load the review list."
              onRetry={() => void review.refetch()}
              className="rounded-xl border border-border bg-card"
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing to review"
              body="No one has been expired for three months or more."
              className="rounded-xl border border-border bg-card"
            />
          ) : (
            items.map((member) => (
              <ReviewCard
                key={member.id}
                member={member}
                busy={busy}
                onRenew={() => setRenewFor(member)}
                onKeepInactive={() => keepInactive.mutate(member.id)}
                onMarkLeft={() => markLeft.mutate(member.id)}
              />
            ))
          )}
        </div>
      </div>

      <RenewSheet
        open={renewFor !== null}
        onOpenChange={(open) => !open && setRenewFor(null)}
        memberName={renewFor?.name ?? ""}
        currentEndDate={renewFor?.currentMembership?.endDate ?? null}
        submitting={renew.isPending}
        onSubmit={(input) =>
          renewFor ? renew.mutate({ memberId: renewFor.id, input }) : undefined
        }
      />
    </AppShell>
  );
}
