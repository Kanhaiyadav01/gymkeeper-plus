export type MemberLifecycle = "ACTIVE" | "LEFT_GYM";

/** Display status derived server-side from membership dates in the gym timezone. */
export type MemberDisplayStatus =
  | "ACTIVE"
  | "EXPIRING"
  | "EXPIRED"
  | "LEFT_GYM"
  | "NO_MEMBERSHIP";

export interface MembershipSummary {
  id: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
}

export interface Member {
  id: string;
  memberNumber: string;
  name: string;
  phone: string | null;
  joiningDate: string;
  notes: string | null;
  lifecycle: MemberLifecycle;
  currentMembership: MembershipSummary | null;
  /** Derived by the server. The UI never recomputes expiry. */
  displayStatus: MemberDisplayStatus;
  /** Negative when already expired. Null when there is no membership. */
  daysRemaining: number | null;
  createdAt: string;
}

export type MemberStatusFilter = "all" | "active" | "expiring" | "expired" | "left";
export type MemberSort = "recent" | "number" | "name" | "expiry";

export interface MemberListParams {
  q: string;
  status: MemberStatusFilter;
  sort: MemberSort;
  page: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
}
