import { useRef, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import type { Member } from "@/features/members/types";

interface MarkAttendanceCardProps {
  found: Member | null;
  searching: boolean;
  marking: boolean;
  errorText: string | null;
  onSearch: (memberNumber: string) => void;
  onMark: (member: Member) => void;
  onClear: () => void;
}

export function MarkAttendanceCard({
  found,
  searching,
  marking,
  errorText,
  onSearch,
  onMark,
  onClear,
}: MarkAttendanceCardProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setValue("");
    onClear();
    inputRef.current?.focus();
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSearch(value);
        }}
      >
        <Label htmlFor="attendance-number" className="text-sm font-medium">
          Member number
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Type the number from the diary, then mark them present.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            id="attendance-number"
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="01045"
            className="h-12 text-base tabular-nums"
          />
          <Button type="submit" className="h-12 px-5" disabled={!value.trim() || searching}>
            <Search className="size-4" aria-hidden />
            {searching ? "Finding…" : "Find"}
          </Button>
        </div>
      </form>

      {errorText ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {errorText}
        </p>
      ) : null}

      {found ? (
        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-3">
            <MemberAvatar name={found.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{found.name}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{found.memberNumber}</p>
            </div>
            <StatusBadge status={found.displayStatus} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              className="h-11 flex-1"
              disabled={marking}
              onClick={() => {
                onMark(found);
                setValue("");
                inputRef.current?.focus();
              }}
            >
              <UserCheck className="size-4" aria-hidden />
              {marking ? "Marking…" : "Mark present"}
            </Button>
            <Button variant="outline" className="h-11" onClick={reset} disabled={marking}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
