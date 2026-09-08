import { queryOptions } from "@tanstack/react-query";
import { getReport } from "@/lib/api/mock-store";
import type { ReportPeriod } from "./types";

/** Single centralized access point. Components never call the store directly. */
export const reportsApi = { get: getReport };

export const reportQueryOptions = (period: ReportPeriod) =>
  queryOptions({
    queryKey: ["report", period],
    queryFn: () => reportsApi.get(period),
  });

export const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_12_months", label: "12 months" },
];
