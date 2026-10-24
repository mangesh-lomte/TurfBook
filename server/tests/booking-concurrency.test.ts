import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Booking Engine & Concurrency Protection Integration Tests', () => {
  let customerToken: string;
  let groundId: string;

  beforeAll(async () => {
    // 1. Log in as seeded customer
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@turfbook.com',
      password: 'Customer@123456',
    });
    customerToken = loginRes.body.data.accessToken;

    // 2. Find an active ground in an approved venue
    const ground = await prisma.ground.findFirst({
      where: { venue: { status: 'APPROVED' }, isActive: true },
    });
    expect(ground).toBeDefined();
    groundId = ground!.id;

    // Clean up any existing bookings for ground created during previous test runs
    await prisma.payment.deleteMany({
      where: { booking: { groundId } },
    });
    await prisma.review.deleteMany({
      where: { booking: { groundId } },
    });
    await prisma.booking.deleteMany({
      where: { groundId },
    });
  });

  it('rejects a booking request scheduled in the past', async () => {
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 1);
    pastStart.setHours(10, 0, 0, 0);
    const pastEnd = new Date(pastStart);
    pastEnd.setHours(11, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        startTime: pastStart.toISOString(),
        endTime: pastEnd.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/past/i);
  });

  it('successfully books a valid upcoming slot', async () => {
    // Choose a future date far ahead (e.g. 14 days out at 10:00 AM UTC)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    futureDate.setUTCHours(10, 0, 0, 0);
    const futureEnd = new Date(futureDate);
    futureEnd.setUTCHours(11, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        startTime: futureDate.toISOString(),
        endTime: futureEnd.toISOString(),
        notes: 'Integration test initial reservation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingNumber).toBeDefined();
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('rejects overlapping booking for the same slot with 409 Conflict', async () => {
    // Attempt to book the EXACT SAME slot that was just reserved in the previous test
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    futureDate.setUTCHours(10, 0, 0, 0);
    const futureEnd = new Date(futureDate);
    futureEnd.setUTCHours(11, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        startTime: futureDate.toISOString(),
        endTime: futureEnd.toISOString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toMatch(/CONFLICT/);
  });

  it('handles SIMULTANEOUS concurrent requests without double booking (PostgreSQL exclusion test)', async () => {
    // Choose 15 days out at 14:00 UTC
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    futureDate.setUTCHours(14, 0, 0, 0);
    const futureEnd = new Date(futureDate);
    futureEnd.setUTCHours(15, 0, 0, 0);

    // Fire 2 concurrent requests at the exact same moment
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          groundId,
          startTime: futureDate.toISOString(),
          endTime: futureEnd.toISOString(),
          notes: 'Concurrent Client 1',
        }),
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          groundId,
          startTime: futureDate.toISOString(),
          endTime: futureEnd.toISOString(),
          notes: 'Concurrent Client 2',
        }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly ONE request must succeed (201) and the conflicting request MUST be rejected (409)
    expect(statuses).toEqual([201, 409]);

    // Verify in database that only ONE booking exists for this slot
    const count = await prisma.booking.count({
      where: {
        groundId,
        startTime: futureDate,
        endTime: futureEnd,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
    });
    expect(count).toBe(1);
  });

  it('restores slot availability when booking is cancelled', async () => {
    // Choose 16 days out
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 16);
    futureDate.setUTCHours(16, 0, 0, 0);
    const futureEnd = new Date(futureDate);
    futureEnd.setUTCHours(17, 0, 0, 0);

    // 1. Create booking
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        startTime: futureDate.toISOString(),
        endTime: futureEnd.toISOString(),
      });
    expect(bookRes.status).toBe(201);
    const bookingId = bookRes.body.data.id;

    // 2. Cancel the booking
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Plans changed for friendly tournament' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // 3. Immediately re-book the same slot -> must now succeed because availability was restored!
    const rebookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        groundId,
        startTime: futureDate.toISOString(),
        endTime: futureEnd.toISOString(),
        notes: 'Rebooked after cancellation',
      });

    expect(rebookRes.status).toBe(201);
    expect(rebookRes.body.success).toBe(true);
  });
});
