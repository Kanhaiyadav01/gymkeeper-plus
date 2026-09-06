export interface AttendanceRecord {
  id: string;
  memberId: string;
  /** Denormalised for list rendering; the serial number is the workflow key. */
  memberNumber: string;
  memberName: string;
  attendanceDate: string;
  markedAt: string;
}
