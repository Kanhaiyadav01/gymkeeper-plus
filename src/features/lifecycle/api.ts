import { queryOptions } from "@tanstack/react-query";
import { keepMemberInactive, listNeedsReview, setMemberLifecycle } from "@/lib/api/mock-store";

/** Single centralized access point. Components never call the store directly. */
export const lifecycleApi = {
  listNeedsReview,
  keepInactive: keepMemberInactive,
  setLifecycle: setMemberLifecycle,
};

export const needsReviewQueryOptions = () =>
  queryOptions({
    queryKey: ["needs-review"],
    queryFn: () => lifecycleApi.listNeedsReview(),
  });
