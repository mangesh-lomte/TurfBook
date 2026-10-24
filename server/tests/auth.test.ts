import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Authentication API Integration Tests', () => {
  it('rejects registration with invalid password (too short or missing caps)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'weak@example.com',
      password: 'short',
      fullName: 'Weak Password User',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('authenticates seeded customer account and returns JWT token', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@turfbook.com',
      password: 'Customer@123456',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('customer@turfbook.com');
    expect(res.body.data.user.role).toBe('CUSTOMER');
  });

  it('rejects login with incorrect password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@turfbook.com',
      password: 'WrongPassword!999',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('retrieves authenticated profile with /api/v1/auth/me', async () => {
    // 1. Log in
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@turfbook.com',
      password: 'Customer@123456',
    });
    const token = loginRes.body.data.accessToken;

    // 2. Fetch /me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('customer@turfbook.com');
  });
});
