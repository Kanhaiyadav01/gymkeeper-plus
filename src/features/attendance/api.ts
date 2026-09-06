import { queryOptions } from "@tanstack/react-query";
import {
  findMemberByNumber,
  listAttendanceByDate,
  listMemberAttendance,
  markAttendance,
  unmarkAttendance,
} from "@/lib/api/mock-store";

/** Single centralized access point. Components never call the store directly. */
export const attendanceApi = {
  findMemberByNumber,
  mark: markAttendance,
  unmark: unmarkAttendance,
  listByDate: listAttendanceByDate,
  listForMember: listMemberAttendance,
};

export const attendanceTodayQueryOptions = () =>
  queryOptions({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceApi.listByDate(),
  });

export const memberAttendanceQueryOptions = (memberId: string) =>
  queryOptions({
    queryKey: ["attendance", "member", memberId],
    queryFn: () => attendanceApi.listForMember(memberId),
  });
