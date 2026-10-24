-- Enable btree_gist extension required for multi-column GiST exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Concurrency Protection: GiST Exclusion Constraint on Bookings
-- Prevents overlapping intervals on the same ground for active bookings (CONFIRMED and PENDING_PAYMENT)
ALTER TABLE "bookings"
ADD CONSTRAINT "no_overlapping_active_bookings"
EXCLUDE USING gist (
  ground_id WITH =,
  tsrange(start_time, end_time, '[)') WITH &&
)
WHERE (status IN ('CONFIRMED', 'PENDING_PAYMENT'));

-- Concurrency Protection: GiST Exclusion Constraint on Blocked Periods
-- Prevents overlapping maintenance or owner-blocked periods on the same ground
ALTER TABLE "blocked_periods"
ADD CONSTRAINT "no_overlapping_blocked_periods"
EXCLUDE USING gist (
  ground_id WITH =,
  tsrange(start_time, end_time, '[)') WITH &&
);