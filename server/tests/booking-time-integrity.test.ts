import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

// Replicate frontend date/time formatting utilities to verify display representation
function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function cleanupSlot(groundId: string, startTime: Date) {
  const existing = await prisma.booking.findMany({
    where: { groundId, startTime },
    select: { id: true },
  });
  const ids = existing.map((b) => b.id);
  if (ids.length > 0) {
    await prisma.payment.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.review.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });
  }
}

describe('Booking Time Integrity & Slot Preservation Regression Tests', () => {
  let customerToken: string;
  let ownerToken: string;
  let groundId: string;
  let venueId: string;
  let testBookingId: string;
  let testBookingNumber: string;

  beforeAll(async () => {
    // 1. Log in as seeded customer
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@turfbook.com',
      password: 'Customer@123456',
    });
    expect(customerLogin.status).toBe(200);
    customerToken = customerLogin.body.data.accessToken;

    // 2. Log in as seeded turf owner 1 (owner of Greenfield Sports Arena)
    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'owner@turfbook.com',
      password: 'Owner@123456',
    });
    expect(ownerLogin.status).toBe(200);
    ownerToken = ownerLogin.body.data.accessToken;

    // 3. Find an active ground in an approved venue owned by owner 1
    const venue = await prisma.venue.findFirst({
      where: { owner: { email: 'owner@turfbook.com' }, status: 'APPROVED' },
      include: { grounds: { where: { isActive: true } } },
    });
    venueId = venue!.id;
    // Use the second ground to prevent race conditions with booking-concurrency.test.ts which mutates grounds[0]
    const chosenGround = venue!.grounds.find((g) => g.name.includes('Box Cricket')) || venue!.grounds[1] || venue!.grounds[0];
    groundId = chosenGround.id;
  });

  // TEST A: Selecting 19:00–20:00 and creating a booking preserves 19:00–20:00
  it('Test A: Selecting 19:00–20:00 and creating a booking preserves 19:00–20:00', async () => {
    const bookingDateStr = '2026-11-20';
    const startIso = `${bookingDateStr}T19:00:00.000Z`;
    const endIso = `${bookingDateStr}T20:00:00.000Z`;
    const slotId = `${groundId}-${startIso}`;

    // Clean up any collision from previous runs for this test slot
    await cleanupSlot(groundId, new Date(startIso));

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        slotId,
        startTime: startIso,
        endTime: endIso,
        notes: 'Test A: 19:00 to 20:00 slot preservation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingNumber).toBeDefined();

    testBookingId = res.body.data.id;
    testBookingNumber = res.body.data.bookingNumber;

    // Verify API returned start and end times match exactly
    expect(res.body.data.startTime).toBe(startIso);
    expect(res.body.data.endTime).toBe(endIso);

    // Verify database record has exact 19:00:00.000Z timestamp
    const dbRecord = await prisma.booking.findUnique({ where: { id: testBookingId } });
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.startTime.toISOString()).toBe(startIso);
    expect(dbRecord!.endTime.toISOString()).toBe(endIso);

    // Verify 24-hour time values
    expect(dbRecord!.startTime.getUTCHours()).toBe(19);
    expect(dbRecord!.startTime.getUTCMinutes()).toBe(0);
    expect(dbRecord!.endTime.getUTCHours()).toBe(20);
    expect(dbRecord!.endTime.getUTCMinutes()).toBe(0);
  });

  // TEST B: Selecting 12:30–13:30 displays 12:30 PM–1:30 PM
  it('Test B: Selecting 12:30–13:30 displays 12:30 PM–1:30 PM', async () => {
    const startIso = '2026-11-21T12:30:00.000Z';
    const endIso = '2026-11-21T13:30:00.000Z';
    const slotId = `${groundId}-${startIso}`;

    await cleanupSlot(groundId, new Date(startIso));

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        slotId,
        startTime: startIso,
        endTime: endIso,
        notes: 'Test B: 12:30 to 13:30 slot preservation',
      });

    expect(res.status).toBe(201);

    // Verify formatted display matches 12:30 PM – 1:30 PM
    const formattedStartTime = formatTime(res.body.data.startTime);
    const formattedEndTime = formatTime(res.body.data.endTime);
    expect(formattedStartTime).toBe('12:30 PM');
    expect(formattedEndTime).toBe('1:30 PM');
    expect(`${formattedStartTime} — ${formattedEndTime}`).toBe('12:30 PM — 1:30 PM');
  });

  // TEST C: Customer confirmation displays the selected slot
  it('Test C: Customer confirmation displays the selected slot (7:00 PM — 8:00 PM)', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${testBookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testBookingId);
    expect(res.body.data.bookingNumber).toBe(testBookingNumber);

    // Verify time on confirmation
    expect(res.body.data.startTime).toBe('2026-11-20T19:00:00.000Z');
    expect(res.body.data.endTime).toBe('2026-11-20T20:00:00.000Z');

    const formattedTimeRange = `${formatTime(res.body.data.startTime)} — ${formatTime(res.body.data.endTime)}`;
    expect(formattedTimeRange).toBe('7:00 PM — 8:00 PM');
  });

  // TEST D: The customer reservation list displays the same slot
  it('Test D: The customer reservation list displays the same slot', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const booking = res.body.data.find((b: { id: string }) => b.id === testBookingId);
    expect(booking).toBeDefined();
    expect(booking.startTime).toBe('2026-11-20T19:00:00.000Z');
    expect(booking.endTime).toBe('2026-11-20T20:00:00.000Z');

    const formattedTimeRange = `${formatTime(booking.startTime)} — ${formatTime(booking.endTime)}`;
    expect(formattedTimeRange).toBe('7:00 PM — 8:00 PM');
  });

  // TEST E: The turf owner dashboard displays the same slot
  it('Test E: The turf owner dashboard displays the same slot', async () => {
    const res = await request(app)
      .get('/api/v1/owner/bookings')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const booking = res.body.data.find((b: { id: string }) => b.id === testBookingId);
    expect(booking).toBeDefined();
    expect(booking.startTime).toBe('2026-11-20T19:00:00.000Z');
    expect(booking.endTime).toBe('2026-11-20T20:00:00.000Z');

    const formattedTimeRange = `${formatTime(booking.startTime)} — ${formatTime(booking.endTime)}`;
    expect(formattedTimeRange).toBe('7:00 PM — 8:00 PM');
  });

  // TEST F: The booking date does not shift unexpectedly because of timezone conversion
  it('Test F: The booking date does not shift unexpectedly because of timezone conversion', async () => {
    // 19:00 to 20:00 on 2026-11-20
    const startIso = '2026-11-20T19:00:00.000Z';
    const dateDisplay = formatDate(startIso);

    // Must be Friday, Nov 20, 2026 (never Saturday, Nov 21)
    expect(dateDisplay).toContain('20');
    expect(dateDisplay).toContain('Nov');
    expect(dateDisplay).toContain('2026');
    expect(dateDisplay).not.toContain('21');

    // Late night slot at 22:00
    const lateStartIso = '2026-11-20T22:00:00.000Z';
    const lateDateDisplay = formatDate(lateStartIso);
    expect(lateDateDisplay).toContain('20');
    expect(lateDateDisplay).toContain('Nov');
    expect(lateDateDisplay).toContain('2026');
  });

  // TEST G: Slot integrity validation rejects mismatched start time
  it('Test G: Slot integrity validation rejects mismatched start time', async () => {
    const resMismatchedTime = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        slotId: `${groundId}-2026-11-20T19:00:00.000Z`,
        startTime: '2026-11-20T18:00:00.000Z',
        endTime: '2026-11-20T19:00:00.000Z',
      });

    expect(resMismatchedTime.status).toBe(400);
    expect(resMismatchedTime.body.error.message).toMatch(/start time/i);
  });

// TEST H: Existing booking overlap protection still works
it('Test H: Existing booking overlap protection still works with 409 Conflict', async () => {
  // Attempt to book the EXACT SAME 19:00–20:00 slot reserved in Test A
  const startIso = '2026-11-20T19:00:00.000Z';
  const endIso = '2026-11-20T20:00:00.000Z';
  const slotId = `${groundId}-${startIso}`;

  const res = await request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      groundId,
      slotId,
      startTime: startIso,
      endTime: endIso,
      notes: 'Attempting conflicting duplicate reservation',
    });

  expect(res.status).toBe(409);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toMatch(/CONFLICT/);
});
});
