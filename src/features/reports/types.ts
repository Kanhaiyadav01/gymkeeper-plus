export type ReportPeriod = "this_month" | "last_month" | "last_12_months";

export interface ReportMembers {
  total: number;
  active: number;
  /** Members who joined inside the period. */
  joined: number;
  leftGym: number;
}

export interface ReportCollection {
  total: number;
  cash: number;
  upi: number;
  paymentCount: number;
  membershipsSold: number;
}

export interface ReportAttendance {
  visits: number;
  uniqueMembers: number;
  averagePerDay: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  periodLabel: string;
  from: string;
  to: string;
  members: ReportMembers;
  collection: ReportCollection;
  attendance: ReportAttendance;
}
