import { useMemo, useState } from "react";
import { Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatDate, todayISO } from "@/features/members/format";
import { DURATION_OPTIONS, renewSchema } from "../schema";
import { membershipsApi } from "../api";
import { formatRupees } from "../format";
import type { MembershipDuration, PaymentMethod, RenewInput } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  /** Current membership end date, or null when the member has none. */
  currentEndDate: string | null;
  submitting: boolean;
  onSubmit: (input: RenewInput) => void;
}

type Errors = Partial<Record<keyof RenewInput, string>>;

export function RenewSheet({
  open,
  onOpenChange,
  memberName,
  currentEndDate,
  submitting,
  onSubmit,
}: Props) {
  const [durationMonths, setDurationMonths] = useState<MembershipDuration>(1);
  const [renewalDate, setRenewalDate] = useState(todayISO());
  const [amount, setAmount] = useState("1000");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [errors, setErrors] = useState<Errors>({});

  const preview = useMemo(() => {
    if (!renewalDate) return null;
    const start = membershipsApi.previewRenewalStart(currentEndDate, renewalDate);
    const end = new Date(`${start}T00:00:00`);
    end.setMonth(end.getMonth() + durationMonths);
    end.setDate(end.getDate() - 1);
    const carriedOver = Boolean(currentEndDate && renewalDate <= currentEndDate);
    return { start, end: end.toISOString().slice(0, 10), carriedOver };
  }, [currentEndDate, renewalDate, durationMonths]);

  function pickDuration(months: MembershipDuration) {
    setDurationMonths(months);
    const option = DURATION_OPTIONS.find((d) => d.months === months);
    if (option) setAmount(String(option.defaultAmount));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = renewSchema.safeParse({
      durationMonths,
      renewalDate,
      amount: Number(amount),
      paymentMethod,
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof RenewInput] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Renew membership</SheetTitle>
          <SheetDescription>
            Recording a new membership and its payment for {memberName}.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 px-4 pb-8" noValidate>
          <fieldset>
            <legend className="text-sm font-medium">Plan</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.months}
                  type="button"
                  aria-pressed={durationMonths === option.months}
                  onClick={() => pickDuration(option.months)}
                  className={cn(
                    "h-12 rounded-lg border text-sm font-medium transition-colors",
                    durationMonths === option.months
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="renewalDate">Renewal date</Label>
            <Input
              id="renewalDate"
              type="date"
              value={renewalDate}
              max={todayISO()}
              onChange={(e) => setRenewalDate(e.target.value)}
              aria-invalid={Boolean(errors.renewalDate)}
              className="h-12"
            />
            {errors.renewalDate ? (
              <p className="text-sm text-destructive">{errors.renewalDate}</p>
            ) : null}
          </div>

          {preview ? (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                New membership: {formatDate(preview.start)} – {formatDate(preview.end)}
              </p>
              <p className="mt-1 text-muted-foreground">
                {preview.carriedOver
                  ? "Renewed early — remaining paid days are carried over, so it starts the day after the current end date."
                  : "Membership had expired, so it starts on the renewal date. The gap isn't backfilled."}
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount collected (₹)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              aria-invalid={Boolean(errors.amount)}
              className="tabular h-12"
            />
            {errors.amount ? <p className="text-sm text-destructive">{errors.amount}</p> : null}
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Payment method</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { value: "CASH" as const, label: "Cash", icon: Banknote },
                  { value: "UPI" as const, label: "UPI", icon: Smartphone },
                ]
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={paymentMethod === value}
                  onClick={() => setPaymentMethod(value)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                    paymentMethod === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="h-12 flex-1">
              {submitting ? "Saving…" : `Record ${formatRupees(Number(amount) || 0)}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
