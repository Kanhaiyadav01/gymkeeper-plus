import { queryOptions } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/mock-store";

/** Single centralized access point. Components never call the store directly. */
export const dashboardApi = {
  get: getDashboard,
};

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
  });
