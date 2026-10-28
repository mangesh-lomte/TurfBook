# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary [Inferred from codebase & workflows]**: Recreational sports players, match organizers, and amateur sports captains seeking verified local turf grounds (football, cricket, pickleball, etc.) to discover open slots, check pitch specifications, coordinate with friends, and lock in bookings instantly without calling venues.
- **Secondary [Inferred from owner portal]**: Commercial sports turf owners, facility operators, and groundskeepers managing multiple pitches, defining hourly rates, tracking daily reservations, scheduling maintenance downtime, and reconciling settled earnings.
- **Tertiary [Inferred from admin portal]**: Platform administrators managing venue compliance inspection, owner account verification, user permissions, and security audit logs.

## Product Purpose

TurfBook eliminates double-booking chaos, opaque pricing, and scheduling friction in sports turf reservations. It provides an authoritative sports facility booking platform where players can discover verified venues, inspect digital twin pitch markings and amenities via an interactive 3D arena, and guarantee match slot reservations backed by database-level concurrency protection and automated refund settlement.

## Positioning

- **Database-Engine GiST Range Exclusion**: Unlike competing aggregators relying on fragile application-level checks, TurfBook enforces absolute zero double-booking at the PostgreSQL engine level using exclusion constraints.
- **Cinematic 3D Facility Spotlight**: Interactive Three.js digital twin enabling players to view realistic surface textures, boundary markings, and night floodlighting conditions before booking.
- **Authoritative Booking & Settlement Ledger**: Atomic reservation references, real-time slot state management (available, selected, booked, maintenance-blocked), and a transparent 2-hour full refund policy.

## Operating Context

- Mobile and desktop web browsers during fast-paced match scheduling in team group chats, on-the-go slot checks, or venue reception check-ins.
- Environments range from bright outdoor daylight at turf sidelines to low-light evening post-match reviews, demanding crisp contrast and immediate visual clarity.

## Capabilities and Constraints

- **Confirmed Capabilities**:
  - Live slot availability grid with date navigation and multi-ground support.
  - Interactive pitch details with FIFA turf / surface specs, amenities, and hourly pricing.
  - One-click instant booking and cancellation flow with immediate refund ledger updates.
  - Turf owner portal for ground configuration, rate management, and maintenance blocking.
  - Platform administrator inspection queue with approve/reject workflows and security audit logs.
  - Polyglot microservice architecture (Node.js/Express core, Python/FastAPI analytics and dynamic pricing).
- **Hard Constraints**:
  - **Booking Time Integrity**: Exact match start and end times must be preserved identically in UTC and local timezone representations across all views (e.g., 19:00–20:00 must remain exactly 19:00–20:00).
  - **Concurrency Invariant**: Double-booking prevention via PostgreSQL GiST exclusion cannot be bypassed.
  - **Role-Based Access Control**: Strict segregation between `CUSTOMER`, `OWNER`, and `ADMIN` routes.

## Brand Commitments

- **Brand Identity**: TurfBook — Premium sports technology company, not a generic dashboard template.
- **Established Color Palette**:
  - Forest Green (`#123B2A`) — Primary brand tone.
  - Deep Emerald (`#176443`, `#0B241A`) — Atmospheric gradients and dark containers.
  - Electric Lime (`#B9F65A`, `#D4FF85`) — High-visibility booking action highlights.
  - Soft White (`#F8FAF7`, `#FFFFFF`) — Primary light surfaces (65–75% balance).
  - Dark Charcoal (`#18231D`, `#526158`) — High-contrast text typography.
- **Anti-References**: Avoid neon glows, washed-out low-contrast gray-on-dark text, generic dashboard cards, and gradient text on long body copy.

## Evidence on Hand

- Fully functional codebase with 31/31 automated tests passing across time integrity, concurrency, RBAC, pricing, and authentication.
- Seeded relational database with authentic venues, grounds, and operating hours across Mumbai, Bengaluru, Hyderabad, and Delhi NCR.
- Three.js interactive 3D Sports Complex Arena component with real-time lighting and orbital controls.
- Absence: No live third-party SMS/payment gateway currently deployed (simulated sandbox gateway recorded authoritatively in database).

## Product Principles

1. **Authoritative Ground Truth**: Time slots, pricing, and booking confirmations must reflect database ledger truth. Never present speculative availability or mask double-booking errors.
2. **Sixty-Second Booking Velocity**: Enable players to find an available court, evaluate surface specs, and lock a reservation in under 60 seconds with clear visual slot indicators and transparent pricing.
3. **Equitable Dual-Sided Predictability**: Protect turf operators against unfillable late vacancies through an explicit 2-hour refund cutoff, while guaranteeing players immediate 100% automated refunds when eligible.
4. **Legibility Under Real Sports Conditions**: High information density, WCAG AA contrast compliance, and legible typography that remains effortless to read under full outdoor sunlight or evening mobile use.

## Accessibility & Inclusion

- Adherence to WCAG AA contrast standards (minimum 4.5:1 for normal body text, 3:1 for large headlines).
- High-contrast button labels (dark text on electric lime, white text on forest green).
- Full keyboard operability and standard ARIA dialog attributes for all modals and date/slot selection chips.

