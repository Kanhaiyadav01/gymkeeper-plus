/**
 * Mock data layer standing in for:
 *   REST API -> Express -> controller -> service -> repository -> Prisma -> PostgreSQL
 *
 * The boundary is deliberately shaped like the real one:
 *  - every read/write is scoped to the tenant from getTenantContext()
 *  - gymId is never accepted from a caller argument
 *  - membership status / expiry / renewal maths is computed here, never in the UI
 *  - membership + payment creation happens together (transaction boundary)
 *  - payments are never deleted, only voided
 *  - errors use the { code, message } envelope
 */
import { addMonths, differenceInCalendarDays, format } from "date-fns";
import { getTenantContext } from "./tenant";
import type {
  Member,
  MemberDisplayStatus,
  MemberListParams,
  Paginated,
} from "@/features/members/types";
import type { MemberEditInput, MemberInput } from "@/features/members/schema";
import type {
  Membership,
  MembershipDuration,
  Payment,
  PaymentMethod,
  RenewInput,
} from "@/features/memberships/types";
import type { DashboardSummary } from "@/features/dashboard/types";
import type { AttendanceRecord } from "@/features/attendance/types";

export class ApiClientError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiClientError";
  }
}

interface MemberRow {
  id: string;
  gymId: string;
  memberNumber: string;
  name: string;
  phone: string | null;
  joiningDate: string;
  notes: string | null;
  lifecycle: "ACTIVE" | "LEFT_GYM";
  /** Date the trainer last reviewed a long-expired member. */
  reviewedAt: string | null;
  createdAt: string;
}

interface MembershipRow {
  id: string;
  gymId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  durationMonths: MembershipDuration;
  createdAt: string;
}

interface PaymentRow {
  id: string;
  gymId: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: "ACTIVE" | "VOID";
  createdAt: string;
}

export const PAGE_SIZE = 20;

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const today = () => new Date();
const todayISO = () => iso(today());
const parse = (d: string) => new Date(`${d}T00:00:00`);

function daysAgo(n: number) {
  const d = today();
  d.setDate(d.getDate() - n);
  return iso(d);
}

function addDays(isoDate: string, n: number) {
  const d = parse(isoDate);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** End date = start + duration months, minus one day. Gym timezone assumed. */
function endDateFor(startDate: string, durationMonths: number): string {
  const end = addMonths(parse(startDate), durationMonths);
  end.setDate(end.getDate() - 1);
  return iso(end);
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${(++seq).toString().padStart(4, "0")}`;

const memberRows: MemberRow[] = [];
const membershipRows: MembershipRow[] = [];
const paymentRows: PaymentRow[] = [];

function seedMember(
  gymId: string,
  memberNumber: string,
  name: string,
  phone: string | null,
  joinedDaysAgo: number,
  membership: {
    startedDaysAgo: number;
    durationMonths: MembershipDuration;
    amount: number;
    method: PaymentMethod;
  } | null,
  lifecycle: "ACTIVE" | "LEFT_GYM" = "ACTIVE",
  notes: string | null = null,
) {
  const member: MemberRow = {
    id: nextId("mem"),
    gymId,
    memberNumber,
    name,
    phone,
    joiningDate: daysAgo(joinedDaysAgo),
    notes,
    lifecycle,
    createdAt: daysAgo(joinedDaysAgo),
  };
  memberRows.push(member);

  if (membership) {
    const startDate = daysAgo(membership.startedDaysAgo);
    const ms: MembershipRow = {
      id: nextId("msh"),
      gymId,
      memberId: member.id,
      startDate,
      endDate: endDateFor(startDate, membership.durationMonths),
      durationMonths: membership.durationMonths,
      createdAt: startDate,
    };
    membershipRows.push(ms);
    paymentRows.push({
      id: nextId("pay"),
      gymId,
      memberId: member.id,
      membershipId: ms.id,
      amount: membership.amount,
      paymentMethod: membership.method,
      paymentDate: startDate,
      status: "ACTIVE",
      createdAt: startDate,
    });
  }
}

/** Two gyms are seeded on purpose so tenant scoping is observable. */
seedMember("gym_001", "01045", "Rahul Kumar", "9876543210", 88, { startedDaysAgo: 88, durationMonths: 3, amount: 2500, method: "CASH" });
seedMember("gym_001", "01046", "Amit Kumar", "9876543210", 85, { startedDaysAgo: 85, durationMonths: 3, amount: 2500, method: "UPI" });
seedMember("gym_001", "01047", "Priya Sharma", "9812345678", 200, { startedDaysAgo: 12, durationMonths: 1, amount: 1000, method: "UPI" });
seedMember("gym_001", "01048", "Sneha Patel", null, 150, { startedDaysAgo: 48, durationMonths: 3, amount: 2500, method: "CASH" }, "ACTIVE", "Prefers evening slot.");
seedMember("gym_001", "01049", "Vikram Singh", "9900112233", 320, { startedDaysAgo: 250, durationMonths: 3, amount: 2400, method: "CASH" });
seedMember("gym_001", "01050", "Neha Gupta", "9876501234", 40, { startedDaysAgo: 40, durationMonths: 1, amount: 1000, method: "UPI" });
seedMember("gym_001", "01051", "Arjun Mehta", "9765432100", 500, { startedDaysAgo: 400, durationMonths: 3, amount: 2400, method: "CASH" }, "LEFT_GYM");
seedMember("gym_001", "01052", "Kavya Nair", "9812345678", 25, { startedDaysAgo: 25, durationMonths: 3, amount: 2500, method: "UPI" });
seedMember("gym_001", "01053", "Rohit Verma", null, 10, null, "ACTIVE", "Joined on a trial, membership pending.");
seedMember("gym_001", "01054", "Ananya Rao", "9123456780", 62, { startedDaysAgo: 62, durationMonths: 3, amount: 2500, method: "CASH" });
seedMember("gym_001", "01055", "Karan Malhotra", "9012345678", 120, { startedDaysAgo: 5, durationMonths: 1, amount: 1000, method: "UPI" });
seedMember("gym_001", "01056", "Divya Menon", "9345678901", 30, { startedDaysAgo: 30, durationMonths: 1, amount: 1000, method: "CASH" });
// Different tenant. Must never be visible to gym_001.
seedMember("gym_002", "01045", "XYZ Fitness Member", "9000000000", 30, { startedDaysAgo: 30, durationMonths: 1, amount: 900, method: "CASH" });

const EXPIRING_SOON_DAYS = 7;

/** Latest membership by end date — the one that determines current status. */
function currentMembershipRow(memberId: string): MembershipRow | null {
  const list = membershipRows
    .filter((m) => m.memberId === memberId)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  return list.length ? list[list.length - 1]! : null;
}

function toMember(row: MemberRow): Member {
  const ms = currentMembershipRow(row.id);
  const daysRemaining = ms === null ? null : differenceInCalendarDays(parse(ms.endDate), parse(todayISO()));

  let displayStatus: MemberDisplayStatus;
  if (row.lifecycle === "LEFT_GYM") displayStatus = "LEFT_GYM";
  else if (daysRemaining === null) displayStatus = "NO_MEMBERSHIP";
  else if (daysRemaining < 0) displayStatus = "EXPIRED";
  else if (daysRemaining <= EXPIRING_SOON_DAYS) displayStatus = "EXPIRING";
  else displayStatus = "ACTIVE";

  return {
    id: row.id,
    memberNumber: row.memberNumber,
    name: row.name,
    phone: row.phone,
    joiningDate: row.joiningDate,
    notes: row.notes,
    lifecycle: row.lifecycle,
    currentMembership: ms
      ? {
          id: ms.id,
          startDate: ms.startDate,
          endDate: ms.endDate,
          durationMonths: ms.durationMonths,
        }
      : null,
    displayStatus,
    daysRemaining,
    createdAt: row.createdAt,
  };
}

const latency = (ms = 260) => new Promise((r) => setTimeout(r, ms));

/** Tenant-scoped row access. Every query starts here. */
function tenantRows(): MemberRow[] {
  const { gymId } = getTenantContext();
  return memberRows.filter((r) => r.gymId === gymId);
}

function requireRow(memberId: string): MemberRow {
  const { gymId } = getTenantContext();
  const row = memberRows.find((r) => r.id === memberId);
  // A row belonging to another gym is indistinguishable from a missing row.
  if (!row || row.gymId !== gymId) {
    throw new ApiClientError("MEMBER_NOT_FOUND", "This member could not be found.");
  }
  return row;
}

function requirePayment(paymentId: string): PaymentRow {
  const { gymId } = getTenantContext();
  const row = paymentRows.find((p) => p.id === paymentId);
  if (!row || row.gymId !== gymId) {
    throw new ApiClientError("PAYMENT_NOT_FOUND", "This payment could not be found.");
  }
  return row;
}

export async function listMembers(params: MemberListParams): Promise<Paginated<Member>> {
  await latency();
  const q = params.q.trim().toLowerCase();
  let list = tenantRows().map(toMember);

  if (q) {
    list = list.filter(
      (m) =>
        m.memberNumber.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.phone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    );
  }

  if (params.status !== "all") {
    const wanted: Record<string, MemberDisplayStatus[]> = {
      active: ["ACTIVE", "EXPIRING"],
      expiring: ["EXPIRING"],
      expired: ["EXPIRED", "NO_MEMBERSHIP"],
      left: ["LEFT_GYM"],
    };
    const allowed = wanted[params.status] ?? [];
    list = list.filter((m) => allowed.includes(m.displayStatus));
  }

  list.sort((a, b) => {
    switch (params.sort) {
      case "number":
        return a.memberNumber.localeCompare(b.memberNumber);
      case "name":
        return a.name.localeCompare(b.name);
      case "expiry":
        return (a.daysRemaining ?? 99999) - (b.daysRemaining ?? 99999);
      default:
        return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
    }
  });

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { items, total, page, pageSize: PAGE_SIZE, totalPages };
}

export async function getMember(memberId: string): Promise<Member> {
  await latency(200);
  return toMember(requireRow(memberId));
}

export async function checkMemberNumber(
  memberNumber: string,
): Promise<{ available: boolean; takenBy?: { id: string; name: string } }> {
  await latency(200);
  const match = tenantRows().find(
    (r) => r.memberNumber.toLowerCase() === memberNumber.trim().toLowerCase(),
  );
  return match ? { available: false, takenBy: { id: match.id, name: match.name } } : { available: true };
}

export async function createMember(input: MemberInput): Promise<Member> {
  await latency(420);
  const { gymId } = getTenantContext();
  const clash = tenantRows().find(
    (r) => r.memberNumber.toLowerCase() === input.memberNumber.trim().toLowerCase(),
  );
  if (clash) {
    throw new ApiClientError(
      "MEMBER_NUMBER_ALREADY_EXISTS",
      `${input.memberNumber} is already used by ${clash.name}.`,
    );
  }
  const row: MemberRow = {
    id: nextId("mem"),
    gymId,
    memberNumber: input.memberNumber.trim(),
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    joiningDate: input.joiningDate,
    notes: input.notes.trim() || null,
    lifecycle: "ACTIVE",
    createdAt: todayISO(),
  };
  memberRows.push(row);
  return toMember(row);
}

export async function updateMember(memberId: string, input: MemberEditInput): Promise<Member> {
  await latency(360);
  const row = requireRow(memberId);
  row.name = input.name.trim();
  row.phone = input.phone.trim() || null;
  row.joiningDate = input.joiningDate;
  row.notes = input.notes.trim() || null;
  return toMember(row);
}

export async function setMemberLifecycle(
  memberId: string,
  lifecycle: "ACTIVE" | "LEFT_GYM",
): Promise<Member> {
  await latency(300);
  const row = requireRow(memberId);
  row.lifecycle = lifecycle;
  return toMember(row);
}

/* -------------------------------------------------------------------------
 * Memberships + payments
 * ---------------------------------------------------------------------- */

function toMembership(row: MembershipRow): Membership {
  const daysRemaining = differenceInCalendarDays(parse(row.endDate), parse(todayISO()));
  return {
    id: row.id,
    memberId: row.memberId,
    startDate: row.startDate,
    endDate: row.endDate,
    durationMonths: row.durationMonths,
    isCurrent: currentMembershipRow(row.memberId)?.id === row.id,
    isActive: daysRemaining >= 0 && parse(row.startDate) <= parse(todayISO()),
    createdAt: row.createdAt,
  };
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    memberId: row.memberId,
    membershipId: row.membershipId,
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    paymentDate: row.paymentDate,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function listMemberships(memberId: string): Promise<Membership[]> {
  await latency(200);
  const row = requireRow(memberId);
  return membershipRows
    .filter((m) => m.memberId === row.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map(toMembership);
}

export async function listPayments(memberId: string): Promise<Payment[]> {
  await latency(200);
  const row = requireRow(memberId);
  return paymentRows
    .filter((p) => p.memberId === row.id)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.id.localeCompare(a.id))
    .map(toPayment);
}

/**
 * Renewal rules (server-side, never trusted from the client):
 *  - renewing while active or on the expiry date -> starts the day after the
 *    current end date, so no paid days are lost
 *  - renewing after expiry (or with no prior membership) -> starts on the
 *    renewal date; the gap is never backfilled
 * Membership + payment are created together.
 */
export function previewRenewalStart(currentEndDate: string | null, renewalDate: string): string {
  if (!currentEndDate) return renewalDate;
  return renewalDate <= currentEndDate ? addDays(currentEndDate, 1) : renewalDate;
}

export async function renewMembership(
  memberId: string,
  input: RenewInput,
): Promise<{ membership: Membership; payment: Payment }> {
  await latency(460);
  const { gymId } = getTenantContext();
  const member = requireRow(memberId);

  if (input.amount <= 0) {
    throw new ApiClientError("INVALID_PAYMENT_AMOUNT", "Payment amount must be greater than zero.");
  }
  if (input.paymentMethod !== "CASH" && input.paymentMethod !== "UPI") {
    throw new ApiClientError("INVALID_PAYMENT_METHOD", "Choose either cash or UPI.");
  }

  const current = currentMembershipRow(member.id);
  const startDate = previewRenewalStart(current?.endDate ?? null, input.renewalDate);

  const membership: MembershipRow = {
    id: nextId("msh"),
    gymId,
    memberId: member.id,
    startDate,
    endDate: endDateFor(startDate, input.durationMonths),
    durationMonths: input.durationMonths,
    createdAt: todayISO(),
  };
  const payment: PaymentRow = {
    id: nextId("pay"),
    gymId,
    memberId: member.id,
    membershipId: membership.id,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    paymentDate: input.renewalDate,
    status: "ACTIVE",
    createdAt: todayISO(),
  };

  // Single transaction boundary: both rows land, or neither does.
  membershipRows.push(membership);
  paymentRows.push(payment);
  // A returning member becomes active again on renewal.
  member.lifecycle = "ACTIVE";

  return { membership: toMembership(membership), payment: toPayment(payment) };
}

/** Editing an amount never touches membership dates. */
export async function updatePaymentAmount(paymentId: string, amount: number): Promise<Payment> {
  await latency(320);
  const row = requirePayment(paymentId);
  if (row.status === "VOID") {
    throw new ApiClientError("PAYMENT_ALREADY_VOID", "A voided payment can't be edited.");
  }
  if (amount <= 0) {
    throw new ApiClientError("INVALID_PAYMENT_AMOUNT", "Payment amount must be greater than zero.");
  }
  row.amount = amount;
  return toPayment(row);
}

/** Payments are never deleted; voiding keeps history and drops it from totals. */
export async function voidPayment(paymentId: string): Promise<Payment> {
  await latency(320);
  const row = requirePayment(paymentId);
  if (row.status === "VOID") {
    throw new ApiClientError("PAYMENT_ALREADY_VOID", "This payment is already void.");
  }
  row.status = "VOID";
  return toPayment(row);
}

/* ------------------------------------------------------------------ *
 * Dashboard (Phase 4)
 * Every count and list below is computed here, tenant-scoped, so the
 * UI never re-derives expiry, thresholds, or money totals.
 * ------------------------------------------------------------------ */

const NEEDS_REVIEW_DAYS = 90;

export async function getDashboard(): Promise<DashboardSummary> {
  await latency(280);
  const members = tenantRows().map(toMember);
  const active = members.filter((m) => m.displayStatus === "ACTIVE" || m.displayStatus === "EXPIRING");
  const expiring = members.filter((m) => m.displayStatus === "EXPIRING");
  const expired = members.filter((m) => m.displayStatus === "EXPIRED");
  const needsReview = expired.filter((m) => (m.daysRemaining ?? 0) <= -NEEDS_REVIEW_DAYS);

  const { gymId } = getTenantContext();
  const monthPrefix = todayISO().slice(0, 7);
  const monthPayments = paymentRows.filter(
    (p) => p.gymId === gymId && p.status === "ACTIVE" && p.paymentDate.startsWith(monthPrefix),
  );
  const collected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const cash = monthPayments
    .filter((p) => p.paymentMethod === "CASH")
    .reduce((sum, p) => sum + p.amount, 0);

  const byExpiry = (a: Member, b: Member) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0);

  return {
    counts: {
      total: members.filter((m) => m.lifecycle === "ACTIVE").length,
      active: active.length,
      expiring: expiring.length,
      expired: expired.length,
      leftGym: members.filter((m) => m.lifecycle === "LEFT_GYM").length,
    },
    collection: { monthTotal: collected, monthCash: cash, monthUpi: collected - cash },
    attendanceToday: countAttendanceToday(),
    expiringSoon: [...expiring].sort(byExpiry).slice(0, 5),
    recentlyExpired: [...expired]
      .filter((m) => (m.daysRemaining ?? 0) > -NEEDS_REVIEW_DAYS)
      .sort((a, b) => (b.daysRemaining ?? 0) - (a.daysRemaining ?? 0))
      .slice(0, 5),
    needsReview: [...needsReview].sort(byExpiry).slice(0, 5),
    needsReviewCount: needsReview.length,
    recentMembers: [...members]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .slice(0, 5),
  };
}

/* ------------------------------------------------------------------ *
 * Attendance (Phase 5)
 * One record per member per day, tenant-scoped. Uniqueness is enforced
 * here the way UNIQUE(gymId, memberId, attendanceDate) enforces it in
 * PostgreSQL — the UI never decides whether a mark is a duplicate.
 * ------------------------------------------------------------------ */

interface AttendanceRow {
  id: string;
  gymId: string;
  memberId: string;
  attendanceDate: string;
  markedAt: string;
}

const attendanceRows: AttendanceRow[] = [];

function toAttendance(row: AttendanceRow): AttendanceRecord {
  const member = memberRows.find((m) => m.id === row.memberId)!;
  return {
    id: row.id,
    memberId: row.memberId,
    memberNumber: member.memberNumber,
    memberName: member.name,
    attendanceDate: row.attendanceDate,
    markedAt: row.markedAt,
  };
}

/** Lookup by serial number — the primary attendance workflow. */
export async function findMemberByNumber(memberNumber: string): Promise<Member> {
  await latency(180);
  const row = tenantRows().find(
    (r) => r.memberNumber.toLowerCase() === memberNumber.trim().toLowerCase(),
  );
  if (!row) {
    throw new ApiClientError("MEMBER_NOT_FOUND", `No member with number ${memberNumber.trim()}.`);
  }
  return toMember(row);
}

/** Expired members can still be marked present — attendance is not gated on membership. */
export async function markAttendance(
  memberId: string,
  attendanceDate: string = todayISO(),
): Promise<AttendanceRecord> {
  await latency(320);
  const { gymId } = getTenantContext();
  const member = requireRow(memberId);
  const existing = attendanceRows.find(
    (a) => a.gymId === gymId && a.memberId === member.id && a.attendanceDate === attendanceDate,
  );
  if (existing) {
    throw new ApiClientError(
      "ATTENDANCE_ALREADY_MARKED",
      `${member.name} is already marked present today.`,
    );
  }
  const row: AttendanceRow = {
    id: nextId("att"),
    gymId,
    memberId: member.id,
    attendanceDate,
    markedAt: new Date().toISOString(),
  };
  attendanceRows.push(row);
  return toAttendance(row);
}

/** Undo a mistaken mark for the same day. */
export async function unmarkAttendance(attendanceId: string): Promise<{ id: string }> {
  await latency(240);
  const { gymId } = getTenantContext();
  const index = attendanceRows.findIndex((a) => a.id === attendanceId && a.gymId === gymId);
  if (index < 0) {
    throw new ApiClientError("ATTENDANCE_NOT_FOUND", "This attendance record could not be found.");
  }
  attendanceRows.splice(index, 1);
  return { id: attendanceId };
}

export async function listAttendanceByDate(
  attendanceDate: string = todayISO(),
): Promise<AttendanceRecord[]> {
  await latency(220);
  const { gymId } = getTenantContext();
  return attendanceRows
    .filter((a) => a.gymId === gymId && a.attendanceDate === attendanceDate)
    .sort((a, b) => b.markedAt.localeCompare(a.markedAt))
    .map(toAttendance);
}

export async function listMemberAttendance(
  memberId: string,
  limit = 30,
): Promise<AttendanceRecord[]> {
  await latency(200);
  const row = requireRow(memberId);
  return attendanceRows
    .filter((a) => a.memberId === row.id)
    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
    .slice(0, limit)
    .map(toAttendance);
}

export function countAttendanceToday(): number {
  const { gymId } = getTenantContext();
  const day = todayISO();
  return attendanceRows.filter((a) => a.gymId === gymId && a.attendanceDate === day).length;
}
