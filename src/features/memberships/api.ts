import { queryOptions } from "@tanstack/react-query";
import {
  listMemberships,
  listPayments,
  previewRenewalStart,
  renewMembership,
  updatePaymentAmount,
  voidPayment,
} from "@/lib/api/mock-store";

/** Single centralized access point. Components never call the store directly. */
export const membershipsApi = {
  listMemberships,
  listPayments,
  renew: renewMembership,
  updatePaymentAmount,
  voidPayment,
  previewRenewalStart,
};

export const membershipsQueryOptions = (memberId: string) =>
  queryOptions({
    queryKey: ["memberships", memberId],
    queryFn: () => membershipsApi.listMemberships(memberId),
  });

export const paymentsQueryOptions = (memberId: string) =>
  queryOptions({
    queryKey: ["payments", memberId],
    queryFn: () => membershipsApi.listPayments(memberId),
  });
