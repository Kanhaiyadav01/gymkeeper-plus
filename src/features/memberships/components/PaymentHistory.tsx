import { useState } from "react";
import { Banknote, Ban, Pencil, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/shared/States";
import { cn } from "@/lib/utils";
import { formatDate } from "@/features/members/format";
import { paymentAmountSchema } from "../schema";
import { formatRupees, methodLabel } from "../format";
import type { Payment } from "../types";

interface Props {
  payments: Payment[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onEditAmount: (paymentId: string, amount: number) => void;
  onVoid: (paymentId: string) => void;
  mutating: boolean;
}

export function PaymentHistory({
  payments,
  isPending,
  isError,
  onRetry,
  onEditAmount,
  onVoid,
  mutating,
}: Props) {
  const [editing, setEditing] = useState<Payment | null>(null);
  const [voiding, setVoiding] = useState<Payment | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = (payments ?? []).filter((p) => p.status === "ACTIVE");
  const collected = active.reduce((sum, p) => sum + p.amount, 0);
  const cash = active.filter((p) => p.paymentMethod === "CASH").reduce((s, p) => s + p.amount, 0);

  function openEdit(payment: Payment) {
    setEditing(payment);
    setAmount(String(payment.amount));
    setError(null);
  }

  function saveEdit() {
    const parsed = paymentAmountSchema.safeParse(Number(amount));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid amount");
      return;
    }
    if (editing) onEditAmount(editing.id, parsed.data);
    setEditing(null);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Payments</h2>
        {!isPending && !isError && active.length ? (
          <p className="tabular text-sm text-muted-foreground">
            {formatRupees(collected)} collected · {formatRupees(cash)} cash
          </p>
        ) : null}
      </div>

      {isPending ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load payments"
          body="Check your connection and try again."
          onRetry={onRetry}
          className="mt-4"
        />
      ) : !payments?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No payments recorded yet. Payments are created when a membership is recorded.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {payments.map((p) => {
            const Icon = p.paymentMethod === "CASH" ? Banknote : Smartphone;
            const isVoid = p.status === "VOID";
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border px-3 py-3",
                  isVoid && "opacity-60",
                )}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn("tabular text-sm font-medium", isVoid && "line-through")}>
                    {formatRupees(p.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {methodLabel(p.paymentMethod)} · {formatDate(p.paymentDate)}
                    {isVoid ? " · voided" : ""}
                  </p>
                </div>
                {isVoid ? (
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    Void
                  </span>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-11"
                      aria-label={`Edit amount for ${formatRupees(p.amount)}`}
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-11 text-destructive hover:text-destructive"
                      aria-label={`Void payment of ${formatRupees(p.amount)}`}
                      onClick={() => setVoiding(p)}
                    >
                      <Ban className="size-4" aria-hidden />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct payment amount</DialogTitle>
            <DialogDescription>
              Correcting the amount does not change the membership dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="editAmount">Amount (₹)</Label>
            <Input
              id="editAmount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              aria-invalid={Boolean(error)}
              className="tabular h-12"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={mutating}>
              Save amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(voiding)} onOpenChange={(o) => !o && setVoiding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              The payment stays in history but stops counting toward totals. Nothing is deleted and
              the membership dates are unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep payment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (voiding) onVoid(voiding.id);
                setVoiding(null);
              }}
            >
              Void payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
