# Fitking's Academy — Implementation Plan (review before build)

## 1. Product understanding

A digital replacement for a gym trainer's paper diary, built from day one as multi-tenant SaaS so it can be sold to other gyms later.

Core model: Gym → Users → Members → Memberships → Payments → Attendance.

Key behaviours:
- Members carry the gym's own serial number (string, leading zeros preserved, unique per gym, entered manually, never regenerated).
- Membership is a separate, historical record (1 or 3 months in V1, extensible). Status is derived from dates in the gym's timezone, never stored as a flag.
- Renewal rules live server-side: renewing early continues from the day after the current end date (no lost paid days); renewing after expiry starts on the renewal date (no backfill). Membership + payment are created in one transaction.
- Payments are CASH or UPI, editable in amount, never deleted — only voided; voiding removes them from financial totals but keeps history. Editing a payment never changes membership dates.
- Lifecycle is ACTIVE / LEFT_GYM only. Expired ≠ left. Members expired 3+ months surface as "Needs Review" with Keep Inactive / Mark Left Gym / Renew. Reactivation keeps the original serial and all history.
- Attendance is optional, one record per member per day, driven by typing the member number and instantly re-focusing for the next entry. Expired members can still be marked present.
- Dashboard is an action centre: counts (total / active / expiring soon / expired), membership alerts, today's attendance, needs review, recent members, quick actions.
- Mobile-first (360–430px), premium green + neutral design system, full loading/empty/error/success states, accessible.

## 2. Platform constraint you need to decide on

This is the one thing I need resolved before writing code.

Your spec requires Next.js App Router + a separate Node/Express API + Prisma + self-managed PostgreSQL. This Lovable project runs **TanStack Start** (React 19, Vite, file-based routing) on an edge runtime, with Lovable Cloud (managed Postgres) as the database. Next.js and a separately deployed long-running Express process are not supported here, and Prisma's engines don't run in this edge runtime.

What is preserved either way — and what actually protects your architecture:
- A real server layer that the browser never bypasses. Server functions / server routes are the transport; behind them the code is plain TypeScript layered exactly as you specified: `routes → controller → service → repository → db`. Business logic (renewal maths, tenant scoping, void rules) sits in services, database access sits in repositories.
- REST endpoints under `/api/v1/...` for anything external, with your standardized `{ success, data }` / `{ success, error: { code, message } }` envelope and error codes.
- Multi-tenancy enforced server-side: `gymId` is always derived from the authenticated session's user, never from body, query, or client state. Every repository function takes tenant context as its first argument. Row-level policies in the database as a second layer.
- Zod validation on every input, server-side, regardless of client validation.
- SQL migrations as the single canonical migration mechanism (in place of Prisma migrate — one system, not two).
- Automated tests for the business rules you listed, with tenant-isolation tests first-class.

Three options:

**A. Build here, adapted stack (recommended).** TanStack Start frontend + server layer + Lovable Cloud Postgres, keeping the layered modular architecture, tenant isolation, REST envelope, and phase order exactly as specified. You get a running product fastest; the service/repository layer is portable to Express later.

**B. Build here, maximally portable.** Same as A, but the entire `modules/` tree (controllers, services, repositories, schemas) is written framework-agnostic with a thin adapter at the edge, so lifting it into Express + Prisma later is mostly mechanical. Slightly more scaffolding up front.

**C. Don't build here.** The exact Next.js + Express + Prisma monorepo is built outside Lovable. I can still produce the full PRD, schema, and module-by-module specs as documents.

Everything below assumes A or B.

## 3. Phase boundaries

Each phase ends with typecheck, lint, tests, a manual check, and a report. Nothing from a later phase gets built early.

**Phase 0 — Foundation.** Folder structure (`src/modules/*` server-side, `src/features/*` client-side, `components/ui`, `lib/api`, `types`, `config`); response envelope + error codes + central error handler; Zod setup; design system (green/neutral tokens, typography, spacing, mobile-first) in `src/styles.css`; test runner.

**Phase 1 — Auth + tenant.** `gyms`, `users`, `sessions` tables. Login / logout / me. Random token, SHA-256 hash stored, raw token in HttpOnly + Secure + SameSite=Lax cookie, 7-day absolute lifetime, expired sessions rejected and cleaned. Tenant context resolved from session → user → gymId. Protected app shell + `/login`.

**Phase 2 — Members.** `members` table with `UNIQUE(gymId, memberNumber)` and indexes. Create, list (paginated, filtered), search by number / name (case-insensitive) / phone, profile page, edit. Member number immutable after creation.

**Phase 3 — Memberships + payments.** `memberships`, `payments` tables. Initial membership, renewal (all three cases), transactional membership+payment creation, payment history, edit amount, void. Timezone-correct date maths.

**Phase 4 — Dashboard.** Counts, membership alerts (7-day threshold), recent members, quick actions.

**Phase 5 — Attendance.** `UNIQUE(gymId, memberId, attendanceDate)`, member-number lookup flow with auto-refocus, today's list, per-member history.

**Phase 6 — Lifecycle.** Needs Review (3+ months expired), Keep Inactive, Mark Left Gym, Reactivate.

**Phase 7 — Reports + polish.** Simple reports (cash vs UPI, new members, attendance counts), state coverage, accessibility, mobile refinement, performance, security review.

## 4. Open questions

1. Stack decision above — A, B, or C?
2. Auth: is the first account seeded by me (you give me an email, I set a password you change on first login), or do you want a self-serve gym signup in Phase 1?
3. Membership pricing: are ₹ amounts free-typed per payment, or should 1-month / 3-month plans have default prices configurable in Settings?
4. Timezone: assume `Asia/Kolkata` as the gym default?
5. Seed data: should Phase 2 ship with your real member list (if you can export the diary), or an empty gym?
