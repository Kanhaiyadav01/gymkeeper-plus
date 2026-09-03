import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { memberInputSchema, type MemberInput } from "../schema";
import { membersApi } from "../api";
import { todayISO } from "../format";

export type MemberFormValues = MemberInput;

type NumberCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; name: string };

type Errors = Partial<Record<keyof MemberFormValues, string>>;

interface Props {
  mode: "create" | "edit";
  initial?: Partial<MemberFormValues> | undefined;
  submitting: boolean;
  formError?: string | null | undefined;
  fieldError?: Errors | undefined;
  onSubmit: (values: MemberFormValues) => void;
  onCancel: () => void;
  onDirtyChange?: ((dirty: boolean) => void) | undefined;
  /** Rendered inside a sticky bar on mobile in create mode. */
  stickyActions?: boolean;
}

export function MemberForm({
  mode,
  initial,
  submitting,
  formError,
  fieldError,
  onSubmit,
  onCancel,
  onDirtyChange,
  stickyActions = false,
}: Props) {
  const [values, setValues] = useState<MemberFormValues>({
    memberNumber: initial?.memberNumber ?? "",
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    joiningDate: initial?.joiningDate ?? todayISO(),
    notes: initial?.notes ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [numberCheck, setNumberCheck] = useState<NumberCheck>({ state: "idle" });
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes));
  const formRef = useRef<HTMLFormElement>(null);

  const merged: Errors = { ...errors, ...fieldError };

  useEffect(() => {
    onDirtyChange?.(
      values.memberNumber !== (initial?.memberNumber ?? "") ||
        values.name !== (initial?.name ?? "") ||
        values.phone !== (initial?.phone ?? "") ||
        values.notes !== (initial?.notes ?? ""),
    );
  }, [values, initial, onDirtyChange]);

  function set<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleNumberBlur() {
    const trimmed = values.memberNumber.trim();
    if (mode !== "create" || !trimmed) return;
    setNumberCheck({ state: "checking" });
    const res = await membersApi.checkNumber(trimmed);
    if (res.available) setNumberCheck({ state: "available" });
    else setNumberCheck({ state: "taken", name: res.takenBy?.name ?? "another member" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = memberInputSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MemberFormValues;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    onSubmit(parsed.data);
  }

  const actions = (
    <>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting} className="min-w-36">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : mode === "create" ? (
          "Save member"
        ) : (
          "Save changes"
        )}
      </Button>
    </>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="memberNumber"
            label="Member number"
            error={merged.memberNumber}
            hint={
              mode === "create"
                ? "The serial number from your diary. Leading zeros are kept. This can't be changed later."
                : "Member numbers stay with the member permanently."
            }
          >
            <div className="relative">
              <Input
                id="memberNumber"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                readOnly={mode === "edit"}
                aria-invalid={Boolean(merged.memberNumber)}
                aria-describedby="memberNumber-hint"
                value={values.memberNumber}
                onChange={(e) => {
                  set("memberNumber", e.target.value);
                  setNumberCheck({ state: "idle" });
                }}
                onBlur={handleNumberBlur}
                className={cn(
                  "h-12 tabular text-base font-medium tracking-wide",
                  mode === "edit" && "bg-muted pr-9 text-muted-foreground",
                )}
                placeholder="01045"
              />
              {mode === "edit" ? (
                <Lock
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </div>
            {mode === "create" && numberCheck.state !== "idle" ? (
              <p
                className={cn(
                  "mt-1.5 flex items-center gap-1.5 text-xs",
                  numberCheck.state === "taken" ? "text-destructive" : "text-success",
                )}
              >
                {numberCheck.state === "checking" ? (
                  <>
                    <Loader2 className="size-3 animate-spin" aria-hidden /> Checking…
                  </>
                ) : numberCheck.state === "available" ? (
                  <>
                    <Check className="size-3" aria-hidden /> Available
                  </>
                ) : (
                  `Already used by ${(numberCheck as { name: string }).name}.`
                )}
              </p>
            ) : null}
          </Field>

          <Field id="joiningDate" label="Joining date" error={merged.joiningDate}>
            <Input
              id="joiningDate"
              type="date"
              max={todayISO()}
              aria-invalid={Boolean(merged.joiningDate)}
              value={values.joiningDate}
              onChange={(e) => set("joiningDate", e.target.value)}
              className="h-12 tabular text-base"
            />
          </Field>
        </div>

        <Field id="name" label="Full name" error={merged.name}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(merged.name)}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className="h-12 text-base"
            placeholder="Rahul Kumar"
          />
        </Field>

        <Field
          id="phone"
          label="Phone"
          optional
          error={merged.phone}
          hint="Family members may share one number."
        >
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(merged.phone)}
            aria-describedby="phone-hint"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="h-12 tabular text-base"
            placeholder="9876543210"
          />
        </Field>

        {showNotes ? (
          <Field id="notes" label="Notes" optional error={merged.notes}>
            <Textarea
              id="notes"
              rows={3}
              maxLength={500}
              aria-invalid={Boolean(merged.notes)}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering about this member."
            />
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Add notes
          </button>
        )}

        {formError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/25 bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}
      </div>

      {stickyActions ? (
        <>
          <div className="h-24 lg:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-50 flex gap-3 border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {submitting ? "Saving…" : "Save member"}
            </Button>
          </div>
          <div className="mt-6 hidden justify-end gap-2 lg:flex">{actions}</div>
        </>
      ) : (
        <div className="mt-6 flex justify-end gap-2">{actions}</div>
      )}
    </form>
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 flex items-center gap-1.5">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
