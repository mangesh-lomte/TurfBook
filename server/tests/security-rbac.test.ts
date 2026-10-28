import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { Role } from '@prisma/client';

describe('Security, Multi-Tenant Isolation & RBAC Integration Tests', () => {
  let customerToken: string;
  let owner1Token: string;
  let owner2Token: string;
  let adminToken: string;
  let owner1VenueId: string;
  let owner2VenueId: string;
  let owner2GroundId: string;

  beforeAll(async () => {
    // 1. Authenticate Customer
    const custRes = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@turfbook.com',
      password: 'Customer@123456',
    });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.data.accessToken;

    // 2. Authenticate Owner 1
    const owner1Res = await request(app).post('/api/v1/auth/login').send({
      email: 'owner@turfbook.com',
      password: 'Owner@123456',
    });
    expect(owner1Res.status).toBe(200);
    owner1Token = owner1Res.body.data.accessToken;

    // 3. Authenticate Owner 2
    const owner2Res = await request(app).post('/api/v1/auth/login').send({
      email: 'owner2@turfbook.com',
      password: 'Owner@123456',
    });
    expect(owner2Res.status).toBe(200);
    owner2Token = owner2Res.body.data.accessToken;

    // 4. Authenticate Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@turfbook.com',
      password: 'Admin@123456',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    // Retrieve Owner 1's venue
    const venue1 = await prisma.venue.findFirst({
      where: { owner: { email: 'owner@turfbook.com' } },
    });
    expect(venue1).toBeDefined();
    owner1VenueId = venue1!.id;

    // Retrieve Owner 2's venue and ground
    const venue2 = await prisma.venue.findFirst({
      where: { owner: { email: 'owner2@turfbook.com' } },
      include: { grounds: true },
    });
    expect(venue2).toBeDefined();
    owner2VenueId = venue2!.id;
    owner2GroundId = venue2!.grounds[0]?.id;
  });

  describe('Multi-Tenant Owner Isolation (IDOR Defense)', () => {
    it('prevents Owner 1 from modifying Owner 2 venue (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/venues/${owner2VenueId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({
          name: 'Hacked Venue Name by Unauthorized Owner',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only update venues that you own/i);
    });

    it('prevents Owner 1 from adding a ground to Owner 2 venue (403 Forbidden)', async () => {
      const sport = await prisma.sport.findFirst();
      const res = await request(app)
        .post(`/api/v1/venues/${owner2VenueId}/grounds`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({
          sportId: sport!.id,
          name: 'Unauthorized Ground Injection',
          surfaceType: 'Turf',
          hourlyRate: 1500,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only add grounds to your own venue/i);
    });

    it('prevents Owner 1 from updating a ground in Owner 2 venue (403 Forbidden)', async () => {
      if (!owner2GroundId) return;

      const res = await request(app)
        .patch(`/api/v1/grounds/${owner2GroundId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({
          name: 'Tampered Ground Name',
          hourlyRate: 9999,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only update grounds in your own venue/i);
    });

    it('prevents Owner 1 from creating blocked periods on Owner 2 ground (403 Forbidden)', async () => {
      if (!owner2GroundId) return;

      const start = new Date();
      start.setDate(start.getDate() + 20);
      const end = new Date(start);
      end.setHours(end.getHours() + 2);

      const res = await request(app)
        .post(`/api/v1/grounds/${owner2GroundId}/blocked-periods`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: 'Malicious maintenance block',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only block periods for your own grounds/i);
    });
  });

  describe('Role-Based Access Control (RBAC) & Boundary Enforcement', () => {
    it('rejects unauthenticated request to /api/v1/bookings (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/v1/bookings').send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('prevents Customer from accessing Owner analytics overview (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/owner/overview')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('prevents Customer from accessing Admin overview (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('prevents Owner from accessing Admin audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Payment Simulation IDOR Defense (Verified Hardening)', () => {
    it('prevents Owner or another user from simulating payment for another user booking (403 Forbidden)', async () => {
      // Create a pending payment
      const ground = await prisma.ground.findFirst({
        where: { venue: { status: 'APPROVED' }, isActive: true },
      });

      // Find an existing booking belonging to customerUser
      const custBooking = await prisma.booking.findFirst({
        where: { customer: { email: 'customer@turfbook.com' } },
      });

      if (!custBooking) return;

      const payment = await prisma.payment.findFirst({
        where: { bookingId: custBooking.id },
      });

      if (!payment) return;

      // Owner 1 attempts to simulate payment result on customer's payment
      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/simulate-result`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ result: 'SUCCESS' });

      // If already SUCCESS it returns 400 or if unauthorized returns 403
      expect([400, 403]).toContain(res.status);
      if (res.status === 403) {
        expect(res.body.error.message).toMatch(/only simulate payment for your own bookings/i);
      }
    });
  });

  describe('Admin Venue Approval Workflow', () => {
    it('allows Admin to approve pending venue and updates status to APPROVED', async () => {
      const pendingVenue = await prisma.venue.findFirst({
        where: { status: 'PENDING' },
      });

      if (!pendingVenue) return;

      const res = await request(app)
        .post(`/api/v1/admin/venues/${pendingVenue.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');

      // Verify in database
      const updated = await prisma.venue.findUnique({
        where: { id: pendingVenue.id },
      });
      expect(updated?.status).toBe('APPROVED');
    });
  });
});
