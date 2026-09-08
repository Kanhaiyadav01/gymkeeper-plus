import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportRow {
  label: string;
  value: string;
  hint?: string;
}

interface Props {
  title: string;
  icon: LucideIcon;
  rows: ReportRow[];
  isPending: boolean;
}

export function ReportSection({ title, icon: Icon, rows, isPending }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-muted/50 p-3">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            {isPending ? (
              <Skeleton className="mt-1.5 h-6 w-16" />
            ) : (
              <dd className="tabular mt-0.5 text-xl font-semibold">{row.value}</dd>
            )}
            {row.hint && !isPending ? (
              <p className="text-xs text-muted-foreground">{row.hint}</p>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
