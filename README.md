# TurfBook — Sports Turf Booking & Management Platform

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**TurfBook** is an enterprise-grade full-stack sports venue discovery and booking SaaS platform. Customers can explore verified sports arenas (football astroturfs, box cricket arenas, FIBA basketball courts), inspect real-time hourly slot availability, interact with a cinematic 3D sports complex, and reserve grounds with zero chance of double bookings. Turf owners manage venue profiles, ground configurations, and reservations, while platform administrators oversee venue approvals and audit trails.

---

## 🌟 Key Engineering Highlights

- **Database-Level Atomic Concurrency Protection**: Zero double bookings guaranteed at the PostgreSQL engine level via `btree_gist` GiST exclusion constraints (`tsrange` non-overlapping active intervals) combined with serializable transactions.
- **Cinematic 3D Interactive Sports Complex**: Custom Three.js WebGL architectural campus with FIFA-regulation football pitch, enclosed box cricket truss cage, and FIBA cushioned acrylic basketball court featuring real-time floodlighting, exponential camera damping, and day/night toggles.
- **Python Diagnostics & Analytics Microservice**: Dedicated FastAPI microservice providing pricing intelligence, operational analytics, and system diagnostics.
- **Sports Photography & High-Fidelity Asset Pipeline**: Sport-matched realistic photography pipeline with automatic fallback handling, 16:10 aspect ratio normalization, and subtle vignette gradients.
- **Authoritative Server Pricing**: The backend strictly computes duration, rates, discounts, and taxes from the PostgreSQL ground rate. Clients cannot tamper with pricing, duration, or booking status.
- **Role-Based Authorization & Security (RBAC)**: Three dedicated roles (`CUSTOMER`, `OWNER`, `ADMIN`) enforced via JWT access tokens and HttpOnly refresh token rotation sessions.
- **Real-Time Dynamic Slot Matrix**: Computes slot states (`AVAILABLE`, `BOOKED`, `BLOCKED`, `PAST`) on demand by querying ground operating hours against active bookings and owner maintenance periods.
- **1-Click Demo Persona Switcher**: Evaluators can instantly switch between Customer, Owner, and Admin personas with a single click from the UI navbar without typing passwords.
- **Comprehensive Automated Test Suite**: 31 Vitest integration tests covering pricing calculations, authentication flows, error handlers, booking time integrity, and simultaneous concurrent race conditions.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["React 18 + TypeScript + Vite<br/>(Tailwind CSS, TanStack Query, Three.js)"]
    API["Express.js REST API v1<br/>(Node.js + TypeScript)"]
    PyService["Python Diagnostics & Analytics<br/>(FastAPI + Uvicorn)"]
    Prisma["Prisma ORM 5.22<br/>(Type-safe Query Engine)"]
    PG[("PostgreSQL 16 Engine<br/>btree_gist Exclusion Constraints")]
    Swagger["OpenAPI 3.0 Swagger UI<br/>(/api-docs)"]

    Client -->|REST API Requests / JSON| API
    API -->|Interactive Docs| Swagger
    API -->|Prisma Client Queries| Prisma
    Prisma -->|Serializable Transactions| PG
    PG -->|Atomic Exclusion Violation 23P01| Prisma
    Prisma -->|HTTP 409 Conflict| API
    API -->|Slot Collision Response| Client
    API -.->|Analytics / Pricing Checks| PyService
```

---

## 🗄️ Database Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Venue : owns
    User ||--o{ Booking : reserves
    User ||--o{ Review : writes
    User ||--o{ Notification : receives
    User ||--o{ RefreshSession : maintains
    User ||--o{ AuditLog : triggers

    Venue ||--|{ Ground : contains
    Venue ||--|{ OperatingHours : specifies
    Venue ||--|{ VenueSport : supports
    Venue ||--o{ Review : collects

    Sport ||--o{ Ground : categorizes
    Sport ||--o{ VenueSport : tagged_in

    Ground ||--o{ Booking : booked_for
    Ground ||--o{ BlockedPeriod : maintained_via

    Booking ||--o{ Payment : paid_with
    Booking ||--o| Review : generates
```

---

## 🔒 The Booking Concurrency Strategy

Preventing double bookings when multiple users attempt to reserve the same turf slot at the exact same millisecond is the central architectural guarantee of TurfBook.

### Why Application-Level Checks Fail
Standard web applications perform a `SELECT ... WHERE startTime < requestedEnd AND endTime > requestedStart`. If no record is returned, they execute `INSERT INTO bookings ...`. Under concurrent traffic, two simultaneous requests can both execute the `SELECT` query before either executes the `INSERT`, resulting in **double bookings**.

### The TurfBook Solution: PostgreSQL GiST Range Exclusion Constraint

TurfBook enforces concurrency protection directly inside the PostgreSQL storage engine using the `btree_gist` extension:

```sql
-- Migration: server/prisma/migrations/20261023235033_add_gist_exclusion_constraint/migration.sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
ADD CONSTRAINT "no_overlapping_active_bookings"
EXCLUDE USING gist (
  ground_id WITH =,
  tsrange(start_time, end_time, '[)') WITH &&
)
WHERE (status IN ('CONFIRMED', 'PENDING_PAYMENT'));
```

### How It Works:
1. When a booking request arrives, `booking.service.ts` wraps the operation inside a serializable Prisma transaction (`prisma.$transaction(..., { isolationLevel: 'Serializable' })`).
2. Even if concurrent threads race past application pre-checks, the PostgreSQL engine evaluates the GiST exclusion constraint on the `(ground_id, tsrange)` index.
3. PostgreSQL allows exactly **one** transaction to commit. The conflicting transaction is immediately aborted by PostgreSQL with error code `23P01` (`exclusion_violation`).
4. Our centralized error handler intercepts this error code and translates it into a clean HTTP `409 Conflict`:
   ```json
   {
     "success": false,
     "error": {
       "code": "BOOKING_SLOT_CONFLICT",
       "message": "This ground has already been booked or blocked for the requested time range. Please choose another slot."
     }
   }
   ```
5. When a customer cancels an eligible reservation, the status transitions to `CANCELLED`. Because the exclusion constraint specifies `WHERE (status IN ('CONFIRMED', 'PENDING_PAYMENT'))`, cancelled slots are **automatically and instantly released** back into the available pool.

---

## 👥 Seeded Demo Credentials

For technical evaluation and testing, pre-seeded accounts with realistic data are ready:

| Role | Email | Password | Pre-seeded Resources |
|---|---|---|---|
| **Platform Administrator** | `admin@turfbook.com` | `Admin@123456` | Platform metrics, pending venue verification queue, audit logs |
| **Turf Owner 1** | `owner@turfbook.com` | `Owner@123456` | Greenfield Sports Arena (Mumbai), Thunderbolt Arena (Hyderabad) |
| **Turf Owner 2** | `owner2@turfbook.com` | `Owner@123456` | Apex Turf & Sports Complex (Bengaluru), Champions Den (Pending) |
| **Customer** | `customer@turfbook.com` | `Customer@123456` | Upcoming & past bookings, match receipts, verified reviews |

> **Pro Tip**: In the UI, click the **"Demo Logins"** dropdown in the top navigation bar to switch personas in 1-click without typing credentials!

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20 or v24+
- **PostgreSQL**: 15 or 16+ running locally on port 5432
- **Python**: 3.10+ (for analytics microservice)
- **npm**: 10+

### Local Native Setup

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mangesh-lomte/TurfBook.git
cd TurfBook
npm run install:all
```

#### 2. Configure Environment Files
Copy the template to create `server/.env`:
```bash
cp server/.env.example server/.env
```
Ensure `DATABASE_URL` matches your local PostgreSQL credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/turfbook?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/turfbook_test?schema=public"
JWT_ACCESS_SECRET="turfbook-dev-access-secret-key-32charslong!"
JWT_REFRESH_SECRET="turfbook-dev-refresh-secret-key-32charslong!"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

#### 3. Run Database Migrations & Seed
```bash
# Run Prisma migrations to create schema and GiST exclusion constraints:
npm run migrate

# Populate database with sports, venues, grounds, and demo accounts:
npm run seed
```

#### 4. Run Automated Tests
```bash
npm test
```
*Executes all 31 backend integration tests covering booking time integrity, RBAC, pricing calculations, authentication flows, and simultaneous PostgreSQL concurrency race conditions.*

#### 5. Start Development Services
Run the full stack concurrently:
```bash
# Terminal 1: Express Backend API (Port 5000)
npm run dev:server

# Terminal 2: Vite React Frontend (Port 5173)
npm run dev:client

# Terminal 3: Python Analytics Service (Port 8000)
npm run py:dev
```

Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

### Docker Compose Setup

TurfBook includes complete multi-stage containerization for PostgreSQL, Express backend, and Nginx-powered React frontend:

```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/api-docs`

---

## 📡 REST API Reference Summary

All primary API endpoints are versioned under `/api/v1`:

### Authentication (`/api/v1/auth`)
- `POST /register`: Register customer or turf owner account
- `POST /login`: Authenticate and receive access token + refresh cookie
- `POST /refresh`: Secure refresh token rotation
- `POST /logout`: Revoke active refresh session
- `GET /me`: Get current authenticated user profile

### Venues (`/api/v1/venues`)
- `GET /`: Search approved venues by name, city, sport, with pagination & sorting
- `GET /:id`: Detailed venue profile with grounds, amenities, and reviews
- `POST /`: Create venue submission (Owner/Admin)
- `PATCH /:id`: Update owned venue details
- `POST /:id/submit-for-approval`: Submit venue for administrator review
- `GET /:venueId/grounds`: List playable grounds for venue
- `POST /:venueId/grounds`: Add playable ground to venue

### Grounds & Availability (`/api/v1/grounds`)
- `GET /:id`: Ground details with surface type and rates
- `PATCH /:id`: Update ground details
- `GET /:id/availability?date=YYYY-MM-DD`: Real-time hourly slot matrix (`AVAILABLE`, `BOOKED`, `BLOCKED`, `PAST`)
- `POST /:id/blocked-periods`: Schedule downtime block for maintenance
- `DELETE /api/v1/blocked-periods/:id`: Release maintenance block

### Bookings (`/api/v1/bookings`)
- `POST /`: Atomically reserve time slot (Protected with GiST exclusion constraint)
- `GET /my`: Customer match reservation history
- `GET /:id`: Booking receipt details
- `POST /:id/cancel`: Cancel eligible booking & release slot back to pool
- `POST /:id/complete`: Mark confirmed booking as completed

### Owner Management (`/api/v1/owner`)
- `GET /overview`: Owner KPIs: revenue, bookings count, occupancy %, top grounds
- `GET /bookings`: Incoming customer reservations ledger
- `GET /revenue`: Revenue breakdowns from verified payments

### Admin Governance (`/api/v1/admin`)
- `GET /overview`: System-wide platform volume and KPIs
- `GET /venues/pending`: Venue verification queue
- `POST /venues/:id/approve`: Approve venue and publish live
- `POST /venues/:id/reject`: Reject venue with feedback reason
- `GET /users`: User directory
- `PATCH /users/:id/status`: Activate or suspend user account
- `GET /audit-logs`: Security and operational audit trails

### Interactive OpenAPI Documentation
Visit `http://localhost:5000/api-docs` in your browser for interactive Swagger testing of every endpoint with request/response schemas.

---

## 🧪 Automated Testing Verification

The integration test suite runs against PostgreSQL and validates:
- **Pricing Calculation Unit Tests**: Correct subtotal, discounts, hourly rates, and tax rounding.
- **Authentication Integration Tests**: Rejection of weak passwords, successful login, incorrect password handling, and protected `/me` profile retrieval.
- **Security & RBAC Tests**: Role access control across Customer, Owner, and Admin boundaries.
- **Booking Time Integrity Tests**: Exact preservation of booking start and end timestamps (e.g. 19:00–20:00 stays 19:00–20:00).
- **Concurrency & Race Condition Tests**: Conflicting simultaneous requests dispatched at the exact same millisecond; verifies that exactly **one** succeeds (201) and the other is aborted by the PostgreSQL GiST exclusion constraint (409).
- **Cancellation Flow**: Cancellation restores slot availability, allowing immediate re-booking.

---

## 🛡️ Security & Privacy Practices

- **Zero Plaintext Secrets**: Passwords hashed with bcrypt (salt rounds: 12). Refresh tokens hashed with SHA-256 before storage.
- **Protection Against IDOR & Privilege Escalation**: Every venue, ground, and booking operation checks user ownership on the server side independent of client inputs.
- **Strict Rate Limiting**: Authentication endpoints rate-limited to prevent brute-force attacks.
- **Security Headers**: Helmet configured for secure HTTP headers.
- **CORS Whitelisting**: Strict origin matching against frontend host.
- **Safe Logging**: Passwords, authorization tokens, and personal credit information are scrubbed from logs.
