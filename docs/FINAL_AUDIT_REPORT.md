# TURFBOOK — FINAL ENGINEERING AUDIT & VERIFICATION REPORT

**Repository:** `TurfBook` — Sports Turf Booking & Multi-Tenant Management Platform  
**Audit Date:** October 24, 2026  
**Auditor:** Senior Full-Stack Engineer, Security Auditor & QA Specialist  
**Target Environment:** Local Node.js v24.22.0 / npm 11.19.1 / PostgreSQL 16.15 / Windows 11  
**Status:** Defensible Portfolio-Ready & Verified Hardened  

---

## A. EXECUTIVE SUMMARY

TurfBook is a full-stack, multi-tenant sports venue booking and SaaS platform designed for customers looking to reserve sports facilities (football, cricket, badminton, tennis) and turf owners managing multiple grounds, operating hours, pricing, and reservations.

This engineering audit evaluated the complete codebase across application security, concurrency safety, multi-tenant resource isolation, PostgreSQL database integrity, frontend accessibility and user experience, and automated test coverage.

### Key Audit Findings & Verifications:
1. **Concurrency Protection Verified Against Real PostgreSQL:** Concurrency tests confirmed that simultaneous bookings for the same ground slot cannot result in a double-booking race condition. PostgreSQL's `btree_gist` extension and an exclusion constraint (`no_overlapping_active_bookings`) enforce mutual exclusion at the storage layer, rejecting racing transactions with error code `23P01` (exclusion violation) mapped to HTTP `409 Conflict`.
2. **Fixed Insecure Direct Object Reference (IDOR) on Payment Simulation:** An authorization bypass vulnerability in `POST /api/v1/payments/:id/simulate-result` allowed any authenticated user to simulate and mark payments for arbitrary bookings as `SUCCESS`. We implemented tenant ownership verification (`userRole !== Role.ADMIN && payment.booking.customerId !== userId`) and verified it with integration tests.
3. **Multi-Tenant Boundary Enforcement Verified:** Access control matrix audits confirmed that turf owners cannot alter venues, create grounds, update grounds, or set maintenance blocks on venues owned by another owner (HTTP `403 Forbidden`). Customers are strictly prevented from invoking owner or administrator operations.
4. **Clean Production Builds & Complete Automated Test Matrix:** Both the Vite React client (`npm run build:client`) and Express TypeScript backend (`npm --prefix server run build`) build cleanly with 0 TypeScript compilation errors. Automated Vitest integration tests passed 23 out of 23 tests across pricing calculations, JWT authentication, PostgreSQL GiST booking concurrency, and multi-tenant RBAC boundaries.
5. **Portfolio Demonstration vs. Production Readiness Assessment:**
   - **Portfolio Demonstration:** **READY**. The application provides high visual polish, complete end-to-end booking workflows, instant seed state, responsive layout, and robust database integrity.
   - **Production Cloud Deployment:** **PENDING EXTERNAL INFRASTRUCTURE**. Live cloud deployment has not been verified because no cloud environment, live payment gateway (e.g. Razorpay / Stripe credentials), or production SMTP server was provisioned for this audit. Payments are explicitly designed and labeled as simulated.

---

## B. AUDIT FINDINGS

| ID | Severity | File & Location | Vulnerability / Issue | Impact | Status |
|---|---|---|---|---|---|
| **SEC-001** | **Medium** | `server/src/modules/payments/payment.service.ts` (L64-98), `payment.controller.ts` (L49-70) | Broken Object Level Authorization (IDOR) on payment result simulation | Any authenticated user could send a POST request with another user's `paymentId` to mark it `SUCCESS`, artificially confirming unowned bookings. | **FIXED & VERIFIED** |
| **SEC-002** | **Low** | `server/src/modules/auth/auth.service.ts` (L45) | Role escalation audit during user registration | Verified that callers cannot register as `Role.ADMIN`; input is strictly sanitized to `Role.OWNER` or `Role.CUSTOMER`. | **VERIFIED SECURE** |
| **SEC-003** | **Informational** | `server/src/modules/payments/payment.service.ts` (L59) | Simulated payment provider in local development | Simulated payments record status `SUCCESS` without real payment processing or banking integration. | **DOCUMENTED** |
| **SEC-004** | **Low / Moderate** | `client/package.json`, `server/package.json` | Dependency audit reports vulnerabilities in devDependencies (`vitest`, `esbuild`, `postcss-nested`, `zod`) | Dev-only tooling vulnerabilities (Vitest mock injection, esbuild dev server, PostCSS quadratic complexity). Zod 3.23 memory limit mitigated by Express 10MB payload limit. Breaking major upgrades avoided to preserve runtime stability. | **DOCUMENTED & MITIGATED** |
| **REL-001** | **High** | `server/prisma/migrations/20261023235033_add_gist_exclusion_constraint/migration.sql` | Concurrent slot race conditions causing double bookings | Without a storage-level exclusion constraint, concurrent transactions checking availability simultaneously can both succeed. PostgreSQL GiST exclusion constraint (`tsrange` overlap) prevents this. | **VERIFIED BY TEST** |
| **UX-001** | **Medium** | `client/src/pages/Home.tsx`, `client/src/pages/ExploreVenues.tsx`, `client/src/pages/VenueDetails.tsx` | Missing image fallbacks, inconsistent card heights, and mobile navbar overflow | Image load failures broke cards; mobile navbar lacked persona switcher for quick demo testing. | **FIXED & POLISHED** |

### Detailed Findings & Fixes Applied:

#### SEC-001: IDOR on Payment Simulation (Fixed)
- **File:** `server/src/modules/payments/payment.service.ts` & `payment.controller.ts`
- **Attack Scenario:** Customer A initiates a booking and receives a `paymentId`. Malicious Customer B captures this ID and sends `POST /api/v1/payments/{paymentId}/simulate-result` with body `{"result": "SUCCESS"}`.
- **Root Cause:** The endpoint authenticated the user via `authenticate` middleware but did not compare `req.user.userId` with `payment.booking.customerId` or verify `req.user.role === Role.ADMIN`.
- **Fix Applied:** Modified `simulatePaymentResult` to require `userId: string` and `userRole: Role`. Added authorization assertion:
  ```typescript
  if (userRole !== Role.ADMIN && payment.booking.customerId !== userId) {
    throw new ForbiddenError('You can only simulate payment for your own bookings');
  }
  ```
- **Regression Test:** Added automated test in `server/tests/security-rbac.test.ts` verifying that non-owners receive `403 Forbidden`.

---

## C. VERIFICATION MATRIX

| Area | Command or Method | Result | Evidence | Remaining Limitation |
|---|---|---|---|---|
| **Client Production Build** | `npm run build:client` | **PASS** | Vite built production bundle (423 kB JS, 41 kB CSS) in 10.88s with 0 TypeScript errors. | N/A |
| **Server Production Build** | `npm --prefix server run build` | **PASS** | TypeScript compiler `tsc` completed with exit code 0; output in `server/dist/`. | N/A |
| **Automated Test Suite** | `npm test` | **PASS** | 4 test suites passed (23/23 tests) across pricing, auth, concurrency, and RBAC in 5.65s. | N/A |
| **PostgreSQL GiST Concurrency** | `booking-concurrency.test.ts` | **PASS** | Fired concurrent requests for identical ground slot; exactly 1 succeeded (201) and 1 failed (409). DB verified single booking. | Verified on real local PostgreSQL 16.15 instance. |
| **Slot Cancellation Availability Release** | `booking-concurrency.test.ts` | **PASS** | Customer cancelled booking; slot immediately re-booked successfully (201). | Verified through integration test. |
| **Multi-Tenant Owner Isolation** | `security-rbac.test.ts` | **PASS** | Cross-owner modifications on venues, grounds, and blocked periods rejected with 403. | Verified with seeded Owner 1 and Owner 2 credentials. |
| **RBAC Route Restrictions** | `security-rbac.test.ts` | **PASS** | Customer blocked from `/owner/*` and `/admin/*` routes with 403 Forbidden. | Verified with seeded Customer credentials. |
| **Admin Venue Approval Workflow** | `security-rbac.test.ts` | **PASS** | Admin approved pending venue; status transitioned from `PENDING` to `APPROVED` in DB. | Verified with seeded Admin credentials. |
| **Password Hashing Security** | `auth.test.ts` & code inspection | **PASS** | `bcryptjs` with 12 salt rounds; weak passwords rejected by Zod schema (422). | N/A |
| **JWT Access & Refresh Token Flow** | `auth.test.ts` & code inspection | **PASS** | Access tokens expire in 15m; refresh tokens stored with SHA-256 hash in DB and rotated on refresh. | N/A |
| **Docker Build & Orchestration** | `docker-compose.yml` inspection | **BLOCKED** | Docker CLI not installed on host machine (`The term 'docker' is not recognized`). | Compose file inspected and validated syntactically; runtime container execution unexecuted. |
| **Production Cloud Deployment** | Environment inspection | **NOT TESTED** | No cloud provider (AWS/GCP/Vercel) or remote database provisioned for this audit. | Explicitly labeled as local verification only. |

---

## D. BUILD AND TEST RESULTS

### 1. Build Verification
```bash
> turfbook@1.0.0 build:client
> npm --prefix client run build
vite v6.4.5 building for production...
✓ 1664 modules transformed.
dist/index.html                   1.29 kB │ gzip:   0.74 kB
dist/assets/index-CAz4TPEQ.css   41.10 kB │ gzip:   7.24 kB
dist/assets/index-DXe7FBRR.js   423.16 kB │ gzip: 108.46 kB
✓ built in 10.88s

> turfbook-server@1.0.0 build
> tsc
Exit Code: 0
```

### 2. Vitest Test Suite Output
```bash
> turfbook@1.0.0 test
> npm --prefix server run test
> vitest run

 RUN  v2.1.9 C:/Users/mange/OneDrive/Desktop/turfbook/server

 ✓ tests/pricing.test.ts (4 tests) 30ms
 ✓ tests/auth.test.ts (4 tests) 1301ms
 ✓ tests/booking-concurrency.test.ts (5 tests) 1471ms
 ✓ tests/security-rbac.test.ts (10 tests) 1772ms

 Test Files  4 passed (4)
      Tests  23 passed (23)
   Duration  5.65s
```

---

## E. BOOKING-INTEGRITY ASSESSMENT

Booking correctness is the single most critical business invariant in TurfBook.

### The Double-Booking Race Condition Problem:
In standard applications, booking logic performs an availability query (`SELECT count(*) FROM bookings WHERE ground_id = $1 AND start_time < $end AND end_time > $start`). If count is 0, the application issues an `INSERT INTO bookings`.
When two customers attempt to book the exact same slot concurrently:
1. Thread A executes the SELECT query and sees 0 existing bookings.
2. Thread B executes the SELECT query simultaneously and also sees 0 existing bookings.
3. Thread A executes `INSERT` and commits.
4. Thread B executes `INSERT` and commits.
**Result:** Double booking occurred despite application-level checks.

### TurfBook's Dual-Layer Defense:
1. **Application Layer (Serializable Transaction):** `server/src/modules/bookings/booking.service.ts` wraps the booking creation in a Prisma `$transaction` with `isolationLevel: Prisma.TransactionIsolationLevel.Serializable`.
2. **Database Layer (Authoritative GiST Exclusion Constraint):**
   Migration `20261023235033_add_gist_exclusion_constraint/migration.sql` creates:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;

   ALTER TABLE "bookings"
   ADD CONSTRAINT "no_overlapping_active_bookings"
   EXCLUDE USING gist (
     ground_id WITH =,
     tsrange(start_time, end_time, '[)') WITH &&
   )
   WHERE (status IN ('CONFIRMED', 'PENDING_PAYMENT'));
   ```
3. **Graceful Error Translation:** When concurrent inserts collide, PostgreSQL raises error code `23P01` (`exclusion_violation`). `errorHandler.ts` catches this error and returns a clean, user-friendly HTTP `409 Conflict` with code `BOOKING_SLOT_CONFLICT`.

**Integrity Verdict:** **VERIFIED AND ENFORCED BY POSTGRESQL ENGINE.** Concurrent integration tests proved that racing simultaneous requests cannot create duplicate bookings in the database.

---

## F. SECURITY ASSESSMENT

1. **Authentication & Password Storage:**
   - Password hashing uses `bcryptjs` with 12 salt rounds (`SALT_ROUNDS = 12`).
   - Registration enforces strong password validation via Zod schema (minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 number).
   - Login rate-limiting is implemented via `express-rate-limit` (30 attempts per 15-minute window).
2. **Session & Token Architecture:**
   - Access tokens are signed JWTs with 15-minute expiration (`JWT_ACCESS_EXPIRES_IN: '15m'`).
   - Refresh tokens are stored in PostgreSQL table `refresh_sessions` with SHA-256 token hashing (`crypto.createHash('sha256')`).
   - Token rotation is enforced on every `/api/v1/auth/refresh` call; previous sessions are invalidated with `isRevoked: true`.
3. **Role-Based Authorization & Multi-Tenancy:**
   - Four distinct roles: Anonymous, `CUSTOMER`, `OWNER`, `ADMIN`.
   - All owner management operations (`/api/v1/owner/*`) and admin operations (`/api/v1/admin/*`) are protected by `authenticate` and `authorize(Role.OWNER, Role.ADMIN)`.
   - Cross-owner resource manipulation (IDOR) on venues, grounds, and blocked maintenance periods is strictly checked against `venue.ownerId === req.user.userId`.
4. **Input Validation & Query Parameterization:**
   - All input bodies and query parameters are validated using Zod schemas (`validateRequest.ts`).
   - Database operations use Prisma ORM with parameterized SQL queries, eliminating SQL injection risks.
   - HTTP response headers are hardened via `helmet()` middleware.

---

## G. CHANGED-FILE SUMMARY

| File Path | Nature of Change | Rationale / Explanation |
|---|---|---|
| `server/src/modules/payments/payment.service.ts` | Modified | Added ownership verification (`userId`, `userRole`) to `simulatePaymentResult` to prevent IDOR vulnerabilities. |
| `server/src/modules/payments/payment.controller.ts` | Modified | Updated controller to pass authenticated `req.user.userId` and `req.user.role` to `paymentService`. |
| `server/tests/security-rbac.test.ts` | Created | Added 10 automated integration tests covering multi-tenant owner isolation, customer RBAC boundaries, payment IDOR defense, and admin approval. |
| `client/src/components/ImageWithFallback.tsx` | Created | Resilient image component with loading skeleton and SVG sports fallback to prevent broken UI on broken external URLs. |
| `client/src/components/VenueCard.tsx` | Created | Unified, responsive venue card component with price formatting, sport badges, and accessible touch targets. |
| `client/src/components/Navbar.tsx` | Modified | Added mobile-responsive quick persona switcher (Customer, Owner, Admin) for portfolio demonstration. |
| `client/src/pages/Home.tsx` | Modified | Polished landing page typography, hero search banner, and venue grid consistency. |
| `client/src/pages/ExploreVenues.tsx` | Modified | Improved filter layout, empty states, and dynamic search results. |
| `client/src/pages/VenueDetails.tsx` | Modified | Polished image gallery, ground tabs, date picker, and interactive time slot selector. |
| `client/src/pages/BookingConfirmation.tsx` | Modified | Added booking recap, receipt card, and print action. |
| `client/src/pages/MyBookings.tsx` | Modified | Added tabbed views (Upcoming / Past / Cancelled) with cancel confirmation modal. |
| `client/src/pages/owner/*.tsx` | Modified | Polished owner dashboard, grounds list, venue forms, and reservation management. |
| `client/src/pages/admin/*.tsx` | Modified | Polished admin approval queue, user directory, and platform audit logs. |

---

## H. REMAINING WORK & RECOMMENDATIONS

1. **Integrate Real Payment Gateway (Priority: High for Commercial Production):**
   - Current implementation uses `PaymentProvider.SIMULATED`.
   - Production requirement: Connect Razorpay / Stripe webhooks with cryptographic HMAC signature verification and idempotency replay protection.
2. **Email & SMS Notifications (Priority: Medium):**
   - In-app notification records are generated in table `notifications`.
   - Production requirement: Connect SendGrid / AWS SES / Twilio for transactional booking receipts and cancellation alerts.
3. **Cloud Infrastructure & Container Deployment (Priority: Medium):**
   - Docker configuration is prepared in `docker-compose.yml`, but execution was blocked locally due to absent Docker runtime on the Windows host.
   - Recommended next step: Deploy to AWS ECS / Render / Fly.io with managed PostgreSQL and automated backups.

---

## I. REPRODUCTION GUIDE

Follow these exact commands to reproduce the verification locally:

### 1. Prerequisites
- Node.js v20+ or v24+
- PostgreSQL 16+ running on `127.0.0.1:5432` with database `turfbook`

### 2. Environment Setup
```bash
# In server directory, copy environment template
cp server/.env.example server/.env
# Ensure DATABASE_URL is set:
# DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/turfbook?schema=public"
# JWT_ACCESS_SECRET="turfbook-super-secure-access-secret-32chars"
# JWT_REFRESH_SECRET="turfbook-super-secure-refresh-secret-32chars"
```

### 3. Database Migration and Seeding
```bash
# Run Prisma migrations to deploy tables and GiST exclusion constraint
npx --prefix server prisma migrate deploy

# Seed database with demo owners, grounds, sports, and admin
npx --prefix server tsx prisma/seed.ts
```

### 4. Execute Full Automated Test Suite
```bash
# Run all Vitest integration tests (pricing, auth, concurrency, RBAC)
npm test
```

### 5. Build Verification
```bash
# Build React client bundle
npm run build:client

# Compile TypeScript server bundle
npm --prefix server run build
```

### 6. Local Development Startup
```bash
# Run backend API server (http://localhost:5000)
npm --prefix server run dev

# In a separate terminal, run frontend Vite dev server (http://localhost:5173)
npm --prefix client run dev
```

---
*Report certified by Senior Audit & QA Engineering Lead — TurfBook Engineering Team.*
