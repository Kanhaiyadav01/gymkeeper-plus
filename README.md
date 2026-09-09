# GymFlow Pro

# FITKING'S ACADEMY — MASTER BUILD PROMPT

You are building a real production-oriented gym management application called:

Fitking's Academy

The initial customer is one gym, but the application MUST be architected from day one as a multi-tenant SaaS product so the same application can later be sold to other gyms.

IMPORTANT:

Do not build the entire application in one step.

First understand the complete product described below and create a clear implementation plan/roadmap.

Then implement the application PART BY PART in the order specified at the end.

Do NOT skip ahead into later features unless explicitly instructed.

==================================================

1. PRODUCT GOAL

==================================================

Fitking's Academy currently manages gym members, membership payments, and attendance manually using a physical diary.

Build a digital replacement for that diary.

The application should allow a trainer/gym owner to:

- Add members

- Give each member an existing gym serial/member number such as 01045

- Store name, phone, joining date and notes

- Record membership plans

- Record payments

- Support Cash and UPI payments

- Automatically calculate membership expiry

- Renew memberships

- Preserve unused membership days during early renewal

- Identify memberships expiring soon

- Identify expired memberships

- Automatically surface members whose membership has been expired for 3+ months for review

- Let the trainer mark a member as "Left Gym"

- Reactivate a returning member without losing historical data

- Optionally record daily attendance

- Mark attendance quickly using the member serial number

- View payment history

- View membership history

- View attendance history

- See useful gym statistics from a dashboard

The application should feel like a premium digital version of the trainer's existing diary.

==================================================

2. HARD TECHNICAL REQUIREMENTS

==================================================

Frontend:

- Next.js

- TypeScript

- App Router

- Tailwind CSS

- shadcn/ui

- Lucide icons

Backend:

- Node.js

- Express

- TypeScript

- Separate backend application

- REST API

Database:

- PostgreSQL

- Prisma ORM

Architecture:

- Modular monolith backend

- REST API

- Feature-based frontend architecture

- Clean separation of concerns

- Multi-tenant architecture

- Server-side tenant isolation

DO NOT replace the backend with:

- Supabase

- Firebase

- BaaS-only architecture

- Serverless database-only architecture

The frontend must NOT connect directly to PostgreSQL.

The backend must be the only layer communicating with PostgreSQL.

Architecture:

Frontend

    ↓

REST API

    ↓

Node.js + Express

    ↓

Controllers

    ↓

Services

    ↓

Repositories

    ↓

Prisma

    ↓

PostgreSQL

==================================================

3. MULTI-TENANT REQUIREMENT

==================================================

This is a critical architectural requirement.

The application must support multiple gyms using the same backend/database.

Conceptually:

User

 ↓

Gym

 ↓

Members

 ↓

Memberships

 ↓

Payments

 ↓

Attendance

Example:

Gym A:

Fitking's Academy

gymId = gym_001

Gym B:

XYZ Fitness

gymId = gym_002

Gym A can ONLY access Gym A data.

Gym B can ONLY access Gym B data.

The frontend must never be trusted to determine the tenant.

Do NOT rely on:

gymId supplied by frontend

gymId in query parameters

gymId in request body

gymId stored in client state

Instead:

Authenticated session

      ↓

User

      ↓

User.gymId

      ↓

Tenant context

The backend must enforce tenant isolation for every gym-owned operation.

==================================================

4. AUTHENTICATION

==================================================

V1 requires trainer/gym owner authentication.

Use secure server-managed sessions.

Preferred model:

Browser

   ↓

HTTP-only secure session cookie

   ↓

Express backend

   ↓

Session record in PostgreSQL

Do NOT store long-lived authentication tokens in localStorage.

Session token requirements:

- Cryptographically random token

- Raw token stored only in browser cookie

- SHA-256 token hash stored in database

- 7-day absolute session lifetime

- Secure cookie in production

- HttpOnly

- SameSite=Lax

- Path=/

- Appropriate Max-Age

- Expired sessions rejected and cleaned up

Authentication APIs:

POST /api/v1/auth/login

POST /api/v1/auth/logout

GET  /api/v1/auth/me

Login must return safe user + gym information.

Never return:

- passwordHash

- raw session token

- session secrets

Invalid login should use a generic error.

==================================================

5. MAIN DATABASE ENTITIES

==================================================

The core entities are:

Gym

User

Session

Member

Membership

Payment

Attendance

Initial conceptual schema:

Gym

- id

- name

- timezone

- createdAt

- updatedAt

User

- id

- gymId

- name

- email

- passwordHash

- status

- createdAt

- updatedAt

Session

- id

- userId

- tokenHash

- expiresAt

- createdAt

Member

- id

- gymId

- memberNumber

- name

- phone

- joiningDate

- status

- notes

- createdAt

- updatedAt

Membership

- id

- gymId

- memberId

- startDate

- endDate

- durationMonths

- createdAt

- updatedAt

Payment

- id

- gymId

- memberId

- membershipId

- amount

- paymentMethod

- paymentDate

- status

- createdAt

- updatedAt

Attendance

- id

- gymId

- memberId

- attendanceDate

- markedAt

Use Prisma migrations as the canonical schema migration mechanism.

Do NOT introduce a second migration system.

==================================================

6. MEMBER MANAGEMENT

==================================================

Every member has a gym serial/member number.

Example:

01045

01046

01047

Important rules:

- Member number is a STRING, never a number

- Leading zeroes must be preserved

- Trainer enters the number manually

- Do not automatically generate it

- Unique within a gym

- Same number can exist in another gym

- Member number should not normally be editable after creation

- Member number stays with the member permanently

Database uniqueness:

UNIQUE(gymId, memberNumber)

Member fields:

- Member ID / serial number

- Name

- Phone

- Joining date

- Notes

- Lifecycle status

Phone numbers:

- Optional

- Not unique

- Multiple family members may share one number

Joining date:

- Required

Member lifecycle:

ACTIVE

LEFT_GYM

Do not automatically assume an expired member has left.

==================================================

7. MEMBERSHIP MANAGEMENT

==================================================

Membership is separate from Member.

A member can have many historical memberships.

Example:

Rahul

 ├── Membership 1

 ├── Membership 2

 └── Membership 3

This preserves history.

Supported durations for V1:

- 1 month

- 3 months

Design the system so future plans such as:

- 2 months

- 6 months

- 12 months

- custom

can be added later.

Membership status is determined from dates.

Active:

startDate <= currentDate <= endDate

Expired:

currentDate > endDate

The gym's timezone must be used for date calculations.

==================================================

8. RENEWAL BUSINESS RULES

==================================================

This logic MUST live in the backend.

Do NOT trust frontend date calculations.

CASE 1 — Renewal while membership is active:

Current:

1 Aug → 31 Aug

Renewed:

25 Aug

New membership starts:

1 Sep

Do not lose the remaining paid days.

CASE 2 — Renewal on expiry date:

Current:

1 Aug → 31 Aug

Renewed:

31 Aug

New membership starts:

1 Sep

CASE 3 — Renewal after expiry:

Current:

1 Aug → 31 Aug

Renewed:

15 Sep

New membership starts:

15 Sep

Do not retroactively cover the gap.

Membership + payment creation should happen inside a database transaction.

==================================================

9. PAYMENT MANAGEMENT

==================================================

Payment methods:

CASH

UPI

Every payment stores:

- Member

- Membership

- Amount

- Payment date

- Method

- Status

Payment amount must be greater than zero for normal membership payments.

Payment editing is allowed.

Example:

Entered:

₹2000

Correct:

₹2500

Payment can be edited.

Editing payment amount must NOT automatically alter:

- membership duration

- membership start date

- membership end date

Payments must NOT be permanently deleted.

Instead:

ACTIVE

VOID

A voided payment remains in history but does not count toward active financial totals.

==================================================

10. MEMBERSHIP EXPIRY & REVIEW

==================================================

Dashboard should automatically identify:

1. Active memberships

2. Expiring soon

3. Recently expired

4. Members expired for 3+ months

Default expiring-soon threshold:

7 days

Example:

Rahul

Membership expires in 3 days

The trainer should be able to quickly open/renew that member.

3+ month expiry:

Do NOT automatically mark the member as Left Gym.

Instead:

3+ months expired

        ↓

Needs Review

Trainer can choose:

- Keep Inactive

- Mark Left Gym

- Renew

==================================================

11. LEFT GYM / REACTIVATION

==================================================

This is a lifecycle action.

If trainer marks:

LEFT_GYM

Then:

- Remove member from normal active dashboard alerts

- Exclude from active counts

- Preserve member record

- Preserve member number

- Preserve payments

- Preserve memberships

- Preserve attendance

Do NOT delete historical data.

If member returns:

LEFT_GYM

   ↓

Reactivate

   ↓

Create new membership

   ↓

Active

Member keeps the original serial number.

==================================================

12. ATTENDANCE

==================================================

Attendance is OPTIONAL.

The application should work perfectly even if the trainer never uses attendance.

If used, the primary workflow is:

Enter Member ID

      ↓

Find member

      ↓

Show member

      ↓

Mark Present

Example:

01045

↓

Rahul Kumar

↓

Present ✓

After successfully marking attendance, input should be ready for the next ID.

Attendance should be fast enough for a trainer to mark many members sequentially.

One member can only have one attendance record per day.

Database constraint:

UNIQUE(gymId, memberId, attendanceDate)

Expired members can still be marked present.

==================================================

13. DASHBOARD

==================================================

Dashboard is an action center, not a data dump.

Primary statistics:

- Total Members

- Active Members

- Expiring Soon

- Expired

Important sections:

Membership Alerts

Today's Attendance

Needs Review

Recent Members

Quick Actions

Quick actions:

- Add Member

- Record Payment

- Mark Attendance

- View Reports

Dashboard should prioritize things that require action.

Historical data belongs inside dedicated pages.

==================================================

14. SEARCH

==================================================

Member search must support:

- Member ID

- Name

- Phone

Examples:

01045

Rahul

9876543210

Name search should be case-insensitive.

Phone numbers may return multiple members.

Search should be fast and tenant-scoped.

==================================================

15. REPORTS

==================================================

V1 reports should stay simple.

Potential metrics:

- Total members

- Active members

- New members

- Payment collection

- Cash collection

- UPI collection

- Attendance count

Do not build advanced analytics until the core workflow is validated.

==================================================

16. FRONTEND ROUTES

==================================================

Primary routes:

/login

/dashboard

/members

/members/new

/members/[memberId]

/attendance

/settings

Additional nested views may be introduced if UX requires them.

==================================================

17. FRONTEND ARCHITECTURE

==================================================

Use feature-based organization.

Conceptually:

src/

├── app/

├── features/

│   ├── auth/

│   ├── members/

│   ├── memberships/

│   ├── payments/

│   ├── attendance/

│   └── dashboard/

├── components/

│   ├── ui/

│   └── shared/

├── lib/

│   ├── api/

│   └── auth/

├── hooks/

├── types/

└── config/

Do not create giant components.

Do not duplicate API logic.

Use a centralized API client.

Do not put critical business logic inside React components.

==================================================

18. BACKEND ARCHITECTURE

==================================================

Use modular monolith architecture.

Conceptually:

apps/api/

└── src/

    ├── modules/

    │   ├── auth/

    │   ├── gyms/

    │   ├── members/

    │   ├── memberships/

    │   ├── payments/

    │   ├── attendance/

    │   ├── dashboard/

    │   └── reports/

    ├── middleware/

    ├── config/

    ├── database/

    ├── errors/

    ├── utils/

    └── app.ts

Inside a feature:

members/

├── members.routes.ts

├── members.controller.ts

├── members.service.ts

├── members.repository.ts

├── members.schema.ts

└── members.types.ts

Controller:

HTTP handling only.

Service:

Business logic.

Repository:

Prisma/database access only.

Schema:

Input validation.

==================================================

19. API STYLE

==================================================

Use REST.

Base path:

/api/v1

Authentication:

POST /api/v1/auth/login

POST /api/v1/auth/logout

GET  /api/v1/auth/me

Members:

POST   /api/v1/members

GET    /api/v1/members

GET    /api/v1/members/:memberId

PATCH  /api/v1/members/:memberId

Memberships:

POST /api/v1/members/:memberId/memberships

GET  /api/v1/members/:memberId/memberships

Payments:

GET   /api/v1/members/:memberId/payments

PATCH /api/v1/payments/:paymentId

POST  /api/v1/payments/:paymentId/void

Attendance:

POST /api/v1/attendance

GET  /api/v1/attendance

GET  /api/v1/members/:memberId/attendance

Dashboard:

GET /api/v1/dashboard

Use standardized API responses:

Success:

{

  "success": true,

  "data": {}

}

Error:

{

  "success": false,

  "error": {

    "code": "ERROR_CODE",

    "message": "Human readable message."

  }

}

Use appropriate HTTP status codes.

==================================================

20. DATA VALIDATION

==================================================

Validate all incoming API data.

Use Zod or an equivalent strongly typed validation system.

Validate on backend even if frontend already validates.

Examples:

- Required fields

- Member number

- Payment amount

- Payment method

- Membership duration

- Dates

- Search parameters

- Pagination

Never rely only on frontend validation.

==================================================

21. SECURITY

==================================================

Security requirements:

- Passwords securely hashed

- No plaintext passwords

- Session token never stored raw

- HTTP-only cookie

- Secure production cookie

- Server-side authorization

- Tenant isolation

- Resource ownership checks

- Input validation

- No sensitive data in responses

- No sensitive data in logs

- No database credentials in frontend

- No secrets committed to Git

Do not expose stack traces or internal database errors to users.

==================================================

22. ERROR HANDLING

==================================================

Use centralized backend error handling.

Typical errors:

MEMBER_NOT_FOUND

MEMBER_NUMBER_ALREADY_EXISTS

INVALID_MEMBER_DATA

INVALID_PAYMENT_AMOUNT

INVALID_PAYMENT_METHOD

MEMBERSHIP_NOT_FOUND

PAYMENT_NOT_FOUND

PAYMENT_ALREADY_VOID

ATTENDANCE_ALREADY_MARKED

UNAUTHORIZED

FORBIDDEN

Keep error response structure consistent.

==================================================

23. UI/UX DIRECTION

==================================================

Use the provided visual reference as the high-level inspiration.

Do NOT spend the initial implementation on elaborate visual experimentation.

The desired direction is:

- Premium

- Clean

- Healthy

- Green + neutral

- Professional

- Mobile-first

- Strong typography

- Clear hierarchy

- Subtle borders/shadows

- Consistent spacing

- Practical interaction design

Avoid:

- excessive gradients

- glassmorphism

- huge cards

- excessive pills

- random colors

- decorative blobs

- excessive animations

- generic AI-generated dashboard patterns

UI should prioritize usability over decoration.

The design system should be reusable throughout the application.

==================================================

24. MOBILE-FIRST REQUIREMENT

==================================================

The primary user will use the application on a phone.

Optimize for approximately:

360px

390px

430px

Desktop should adapt the same design system.

Important actions must be easy to use one-handed.

Common workflows should require minimal taps.

Touch targets should generally be around 44px or larger where practical.

==================================================

25. REQUIRED UI STATES

==================================================

Important views must have:

- Loading state

- Empty state

- Error state

- Success feedback

Examples:

No members yet

No members found

Couldn't load members

Member created successfully

Membership renewed successfully

Do not leave blank screens during loading.

==================================================

26. ACCESSIBILITY

==================================================

Use:

- Semantic HTML

- Proper form labels

- Visible focus states

- Keyboard navigation

- Sufficient contrast

- Accessible interactive controls

- Status communicated through text/icons as well as color

==================================================

27. PERFORMANCE

==================================================

Keep the application fast.

Use:

- Pagination for member lists

- Efficient database queries

- Appropriate indexes

- Avoid unnecessary API calls

- Avoid loading huge histories at once

- Reasonable client-side JavaScript

- Optimized assets

Do not prematurely introduce Redis or other infrastructure.

==================================================

28. TESTING

==================================================

Critical backend business rules must have automated tests.

Test:

Authentication

Tenant isolation

Member creation

Member ID uniqueness

Leading zeros

Shared phone numbers

Search

Pagination

Membership date calculations

Early renewals

Late renewals

Payment editing

Payment voiding

Attendance duplicates

3+ month review logic

Left Gym

Reactivation

Multi-tenant tests are especially important.

Example:

Gym A cannot read Gym B's members.

Gym A cannot modify Gym B's payments.

Gym A cannot read Gym B's attendance.

==================================================

29. DEVELOPMENT PHASES

==================================================

Implement strictly in this order.

PHASE 0 — PROJECT FOUNDATION

- Monorepo

- Next.js web app

- Node.js + Express API

- TypeScript

- PostgreSQL

- Prisma

- Environment configuration

- API foundation

- Error handling

- Design system foundation

- Linting/typechecking

- Testing setup

PHASE 1 — AUTH + GYM/TENANT

- Gym

- User

- Session

- Login

- Logout

- Current user

- Secure session

- Tenant context

- Protected frontend shell

PHASE 2 — MEMBER MANAGEMENT

- Member model

- Add member

- Member list

- Search

- Filters

- Pagination

- Member profile

- Edit member

PHASE 3 — MEMBERSHIP + PAYMENTS

- Membership model

- Payment model

- Initial membership

- Cash/UPI

- Membership expiry

- Renewal

- Early renewal rules

- Late renewal rules

- Payment history

- Edit payment

- Void payment

PHASE 4 — DASHBOARD

- Total members

- Active members

- Expiring soon

- Expired

- Membership alerts

- Quick actions

- Recent members

PHASE 5 — ATTENDANCE

- Daily attendance

- Member ID lookup

- Mark present

- Duplicate prevention

- Today's attendance

- Member attendance history

PHASE 6 — MEMBER LIFECYCLE

- 3+ month Needs Review

- Keep Inactive

- Left Gym

- Reactivate

PHASE 7 — REPORTS + POLISH

- Basic reports

- Cash vs UPI

- Member statistics

- Loading states

- Empty states

- Error states

- Accessibility

- Mobile refinement

- Performance

- Security review

- Final testing

==================================================

30. IMPLEMENTATION RULE

==================================================

Do NOT implement all phases at once.

First produce a concise implementation plan based on this specification.

Then wait for instruction before starting the next phase.

When a phase is authorized:

1. Read existing project structure.

2. Read existing implementation.

3. Reuse existing architecture.

4. Do not create a competing architecture.

5. Implement only the requested phase.

6. Run tests/typecheck/lint.

7. Verify the feature manually where applicable.

8. Report exactly what changed.

9. Stop.

Never silently implement future phases.

==================================================

31. CODE QUALITY RULES

==================================================

Write production-quality code.

Avoid:

- giant files

- giant controllers

- giant React components

- duplicated business logic

- duplicated API clients

- magic values

- hardcoded gym-specific data

- unnecessary dependencies

- unnecessary abstraction

- direct database access from UI

Prefer:

- clear modules

- strong typing

- small focused functions

- reusable components where reuse exists

- centralized validation

- centralized error handling

- service-layer business logic

- repository-layer persistence

- explicit tenant context

- database constraints

==================================================

32. FINAL PRODUCT ARCHITECTURE

==================================================

Expected overall architecture:

fitkings-academy/

│

├── apps/

│   ├── web/

│   │   └── Next.js + TypeScript

│   │

│   └── api/

│       └── Node.js + Express + TypeScript

│

├── docs/

│   └── PRD.md

│

├── .agents/

│   ├── AGENTS.md

│   └── skills/

│

└── package.json

Backend:

Next.js

   ↓

REST API

   ↓

Express

   ↓

Middleware

   ↓

Controllers

   ↓

Services

   ↓

Repositories

   ↓

Prisma

   ↓

PostgreSQL

Multi-tenant:

Authenticated User

   ↓

Gym

   ↓

Tenant-scoped data

==================================================

33. FINAL INSTRUCTION

==================================================

First understand the entire application.

Do NOT generate a fake full application with incomplete placeholder functionality.

Do NOT substitute the specified architecture with Supabase/Firebase.

Do NOT build every screen at once.

Create the product incrementally, phase by phase.

The final goal is a real application that can first run Fitking's Academy and later be offered to other gyms without rewriting the core architecture.

Start by returning: this is the Ui for reference 

1. Your understanding of the product.

2. The proposed implementation plan.

3. The phase boundaries.

4. Any genuine technical risks or ambiguities you need resolved.

Do not start implementation until the plan is reviewed.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37c36576-b68a-4714-8bc3-641943852e13).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
