export type MembershipDuration = 1 | 3;
export type PaymentMethod = "CASH" | "UPI";
export type PaymentStatus = "ACTIVE" | "VOID";

export interface Membership {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string;
  durationMonths: MembershipDuration;
  /** Latest membership on the member — the one that drives display status. */
  isCurrent: boolean;
  /** Running today, in the gym timezone. Derived server-side. */
  isActive: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface RenewInput {
  durationMonths: MembershipDuration;
  renewalDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
}
