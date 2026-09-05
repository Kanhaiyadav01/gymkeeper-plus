import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  CreditCard,
  Pencil,
  Phone,
  RotateCcw,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppShell } from "@/components/shared/AppShell";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/States";
import { MemberForm, type MemberFormValues } from "@/features/members/components/MemberForm";
import { memberQueryOptions, membersApi } from "@/features/members/api";
import { expiryRelative, formatDate } from "@/features/members/format";
import {
  membershipsApi,
  membershipsQueryOptions,
  paymentsQueryOptions,
} from "@/features/memberships/api";
import { MembershipHistory } from "@/features/memberships/components/MembershipHistory";
import { PaymentHistory } from "@/features/memberships/components/PaymentHistory";
import { RenewSheet } from "@/features/memberships/components/RenewSheet";
import type { RenewInput } from "@/features/memberships/types";
import { ApiClientError } from "@/lib/api/mock-store";
import type { Member } from "@/features/members/types";


const LIST_SEARCH = { q: "", status: "all", sort: "recent", page: 1 } as const;

export const Route = createFileRoute("/members/$memberId")({
  head: () => ({
    meta: [
      { title: "Member profile — Fitking's Academy" },
      {
        name: "description",
        content:
          "View a member's details, membership status, payment history and attendance in one profile.",
      },
      { property: "og:title", content: "Member profile — Fitking's Academy" },
      {
        property: "og:description",
        content: "Member details, membership status, payments and attendance.",
      },
    ],
  }),
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { memberId } = Route.useParams();
  const query = useQuery(memberQueryOptions(memberId));

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl">
        <header className="pt-6 pb-5">
          <Link
            to="/members"
            search={LIST_SEARCH}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Members
          </Link>
        </header>

        {query.isPending ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : query.isError ? (
          <ErrorState
            title={
              query.error instanceof ApiClientError && query.error.code === "MEMBER_NOT_FOUND"
                ? "Member not found"
                : "Couldn't load this member"
            }
            body={
              query.error instanceof ApiClientError
                ? query.error.message
                : "Check your connection and try again."
            }
            onRetry={() => void query.refetch()}
            className="rounded-xl border border-border bg-card"
          />
        ) : (
          <MemberDetail member={query.data} />
        )}
      </div>
    </AppShell>
  );
}

function MemberDetail({ member }: { member: Member }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const memberships = useQuery(membershipsQueryOptions(member.id));
  const payments = useQuery(paymentsQueryOptions(member.id));

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["member", member.id] });
    await queryClient.invalidateQueries({ queryKey: ["members"] });
    await queryClient.invalidateQueries({ queryKey: ["memberships", member.id] });
    await queryClient.invalidateQueries({ queryKey: ["payments", member.id] });
  };

  const renew = useMutation({
    mutationFn: (input: RenewInput) => membershipsApi.renew(member.id, input),
    onSuccess: async () => {
      await invalidate();
      setRenewing(false);
      toast.success("Membership renewed and payment recorded");
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiClientError ? error.message : "Couldn't renew this membership.",
      ),
  });

  const editAmount = useMutation({
    mutationFn: ({ paymentId, amount }: { paymentId: string; amount: number }) =>
      membershipsApi.updatePaymentAmount(paymentId, amount),
    onSuccess: async () => {
      await invalidate();
      toast.success("Payment amount corrected");
    },
    onError: (error) =>
      toast.error(error instanceof ApiClientError ? error.message : "Couldn't save that amount."),
  });

  const voidPay = useMutation({
    mutationFn: (paymentId: string) => membershipsApi.voidPayment(paymentId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Payment voided — it stays in history");
    },
    onError: (error) =>
      toast.error(error instanceof ApiClientError ? error.message : "Couldn't void that payment."),
  });


  const update = useMutation({
    mutationFn: (values: MemberFormValues) =>
      membersApi.update(member.id, {
        name: values.name,
        phone: values.phone,
        joiningDate: values.joiningDate,
        notes: values.notes,
      }),
    onSuccess: async () => {
      await invalidate();
      setEditing(false);
      toast.success("Member details updated");
    },
    onError: () => toast.error("Couldn't save these changes."),
  });

  const lifecycle = useMutation({
    mutationFn: (next: "ACTIVE" | "LEFT_GYM") => membersApi.setLifecycle(member.id, next),
    onSuccess: async (updated) => {
      await invalidate();
      toast.success(
        updated.lifecycle === "LEFT_GYM"
          ? `${updated.name} marked as left gym`
          : `${updated.name} reactivated`,
      );
    },
    onError: () => toast.error("Couldn't update this member's status."),
  });

  const expiry = expiryRelative(member.daysRemaining);

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <MemberAvatar name={member.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="tabular text-sm font-medium text-muted-foreground">
              {member.memberNumber}
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight">{member.name}</h1>
            <div className="mt-2">
              <StatusBadge status={member.displayStatus} />
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)} className="h-11">
            <Pencil className="size-4" aria-hidden />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail icon={Phone} label="Phone" value={member.phone ?? "Not recorded"} />
          <Detail icon={CalendarDays} label="Joined" value={formatDate(member.joiningDate)} />
          <Detail
            icon={Clock}
            label="Membership"
            value={
              member.currentMembership
                ? `${formatDate(member.currentMembership.startDate)} – ${formatDate(
                    member.currentMembership.endDate,
                  )}${expiry ? ` · ${member.daysRemaining! < 0 ? "expired" : "expires"} ${expiry}` : ""}`
                : "No membership recorded"
            }
          />
          <Detail icon={CreditCard} label="Notes" value={member.notes ?? "—"} />
        </dl>

        <Button className="mt-6 h-12 w-full sm:w-auto" onClick={() => setRenewing(true)}>
          <CreditCard className="size-4" aria-hidden />
          {member.currentMembership ? "Renew membership" : "Record first membership"}
        </Button>
      </section>


      <div className="mt-4 space-y-4">
        <MembershipHistory
          memberships={memberships.data}
          isPending={memberships.isPending}
          isError={memberships.isError}
          onRetry={() => void memberships.refetch()}
        />
        <PaymentHistory
          payments={payments.data}
          isPending={payments.isPending}
          isError={payments.isError}
          onRetry={() => void payments.refetch()}
          onEditAmount={(paymentId, amount) => editAmount.mutate({ paymentId, amount })}
          onVoid={(paymentId) => voidPay.mutate(paymentId)}
          mutating={editAmount.isPending || voidPay.isPending}
        />
      </div>

      <RenewSheet
        open={renewing}
        onOpenChange={setRenewing}
        memberName={member.name}
        currentEndDate={member.currentMembership?.endDate ?? null}
        submitting={renew.isPending}
        onSubmit={(input) => renew.mutate(input)}
      />


      <section className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold">Lifecycle</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Marking a member as left keeps every record; nothing is deleted.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {member.lifecycle === "ACTIVE" ? (
            <Button
              variant="outline"
              disabled={lifecycle.isPending}
              onClick={() => lifecycle.mutate("LEFT_GYM")}
              className="h-11"
            >
              <UserMinus className="size-4" aria-hidden />
              Mark left gym
            </Button>
          ) : (
            <Button
              disabled={lifecycle.isPending}
              onClick={() => lifecycle.mutate("ACTIVE")}
              className="h-11"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reactivate member
            </Button>
          )}
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => void navigate({ to: "/members", search: LIST_SEARCH })}
          >
            Back to members
          </Button>
        </div>
      </section>

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit member</SheetTitle>
            <SheetDescription>
              The member number stays with this member permanently.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <MemberForm
              mode="edit"
              submitting={update.isPending}
              initial={{
                memberNumber: member.memberNumber,
                name: member.name,
                phone: member.phone ?? "",
                joiningDate: member.joiningDate,
                notes: member.notes ?? "",
              }}
              onSubmit={(values) => update.mutate(values)}
              onCancel={() => setEditing(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium break-words">{value}</dd>
      </div>
    </div>
  );
}
