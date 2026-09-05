import type { Member } from "@/features/members/types";

export interface DashboardCounts {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  leftGym: number;
}

export interface DashboardCollection {
  monthTotal: number;
  monthCash: number;
  monthUpi: number;
}

export interface DashboardSummary {
  counts: DashboardCounts;
  collection: DashboardCollection;
  expiringSoon: Member[];
  recentlyExpired: Member[];
  needsReview: Member[];
  needsReviewCount: number;
  recentMembers: Member[];
}
