import { queryOptions } from "@tanstack/react-query";
import {
  checkMemberNumber,
  createMember,
  getMember,
  listMembers,
  setMemberLifecycle,
  updateMember,
} from "@/lib/api/mock-store";
import type { MemberListParams } from "./types";

/** Single centralized access point. Components never call the store directly. */
export const membersApi = {
  list: listMembers,
  get: getMember,
  create: createMember,
  update: updateMember,
  checkNumber: checkMemberNumber,
  setLifecycle: setMemberLifecycle,
};

export const membersQueryOptions = (params: MemberListParams) =>
  queryOptions({
    queryKey: ["members", params],
    queryFn: () => membersApi.list(params),
  });

export const memberQueryOptions = (memberId: string) =>
  queryOptions({
    queryKey: ["member", memberId],
    queryFn: () => membersApi.get(memberId),
  });
