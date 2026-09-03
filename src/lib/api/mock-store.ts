/**
 * Mock data layer standing in for:
 *   REST API -> Express -> controller -> service -> repository -> Prisma -> PostgreSQL
 *
 * The boundary is deliberately shaped like the real one:
 *  - every read/write is scoped to the tenant from getTenantContext()
 *  - gymId is never accepted from a caller argument
 *  - membership status / expiry is computed here, never in the UI
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
  membership: { id: string; startDate: string; durationMonths: number } | null;
  createdAt: string;
}

export const PAGE_SIZE = 20;

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const today = () => new Date();

function daysAgo(n: number) {
  const d = today();
  d.setDate(d.getDate() - n);
  return iso(d);
}

let seq = 0;
const nextId = () => `mem_${(++seq).toString().padStart(4, "0")}`;

function seedMember(
  gymId: string,
  memberNumber: string,
  name: string,
  phone: string | null,
  joinedDaysAgo: number,
  membership: { startedDaysAgo: number; durationMonths: number } | null,
  lifecycle: "ACTIVE" | "LEFT_GYM" = "ACTIVE",
  notes: string | null = null,
): MemberRow {
  return {
    id: nextId(),
    gymId,
    memberNumber,
    name,
    phone,
    joiningDate: daysAgo(joinedDaysAgo),
    notes,
    lifecycle,
    membership: membership
      ? {
          id: `msh_${memberNumber}`,
          startDate: daysAgo(membership.startedDaysAgo),
          durationMonths: membership.durationMonths,
        }
      : null,
    createdAt: daysAgo(joinedDaysAgo),
  };
}

/** Two gyms are seeded on purpose so tenant scoping is observable. */
const rows: MemberRow[] = [
  seedMember("gym_001", "01045", "Rahul Kumar", "9876543210", 88, { startedDaysAgo: 88, durationMonths: 3 }),
  seedMember("gym_001", "01046", "Amit Kumar", "9876543210", 85, { startedDaysAgo: 85, durationMonths: 3 }),
  seedMember("gym_001", "01047", "Priya Sharma", "9812345678", 200, { startedDaysAgo: 12, durationMonths: 1 }),
  seedMember("gym_001", "01048", "Sneha Patel", null, 150, { startedDaysAgo: 48, durationMonths: 3 }, "ACTIVE", "Prefers evening slot."),
  seedMember("gym_001", "01049", "Vikram Singh", "9900112233", 320, { startedDaysAgo: 250, durationMonths: 3 }),
  seedMember("gym_001", "01050", "Neha Gupta", "9876501234", 40, { startedDaysAgo: 40, durationMonths: 1 }),
  seedMember("gym_001", "01051", "Arjun Mehta", "9765432100", 500, { startedDaysAgo: 400, durationMonths: 3 }, "LEFT_GYM"),
  seedMember("gym_001", "01052", "Kavya Nair", "9812345678", 25, { startedDaysAgo: 25, durationMonths: 3 }),
  seedMember("gym_001", "01053", "Rohit Verma", null, 10, null, "ACTIVE", "Joined on a trial, membership pending."),
  seedMember("gym_001", "01054", "Ananya Rao", "9123456780", 62, { startedDaysAgo: 62, durationMonths: 3 }),
  seedMember("gym_001", "01055", "Karan Malhotra", "9012345678", 120, { startedDaysAgo: 5, durationMonths: 1 }),
  seedMember("gym_001", "01056", "Divya Menon", "9345678901", 30, { startedDaysAgo: 30, durationMonths: 1 }),
  // Different tenant. Must never be visible to gym_001.
  seedMember("gym_002", "01045", "XYZ Fitness Member", "9000000000", 30, { startedDaysAgo: 30, durationMonths: 1 }),
];

function endDateOf(row: MemberRow): string | null {
  if (!row.membership) return null;
  const start = new Date(`${row.membership.startDate}T00:00:00`);
  const end = addMonths(start, row.membership.durationMonths);
  end.setDate(end.getDate() - 1);
  return iso(end);
}

const EXPIRING_SOON_DAYS = 7;

function toMember(row: MemberRow): Member {
  const end = endDateOf(row);
  const daysRemaining =
    end === null ? null : differenceInCalendarDays(new Date(`${end}T00:00:00`), new Date(iso(today()) + "T00:00:00"));

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
    currentMembership:
      row.membership && end
        ? {
            id: row.membership.id,
            startDate: row.membership.startDate,
            endDate: end,
            durationMonths: row.membership.durationMonths,
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
  return rows.filter((r) => r.gymId === gymId);
}

function requireRow(memberId: string): MemberRow {
  const { gymId } = getTenantContext();
  const row = rows.find((r) => r.id === memberId);
  // A row belonging to another gym is indistinguishable from a missing row.
  if (!row || row.gymId !== gymId) {
    throw new ApiClientError("MEMBER_NOT_FOUND", "This member could not be found.");
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
    id: nextId(),
    gymId,
    memberNumber: input.memberNumber.trim(),
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    joiningDate: input.joiningDate,
    notes: input.notes.trim() || null,
    lifecycle: "ACTIVE",
    membership: null,
    createdAt: iso(today()),
  };
  rows.push(row);
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
