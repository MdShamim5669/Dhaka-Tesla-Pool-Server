import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Auth & Protected Routes Integration Tests', () => {
  it('GET /api/v1/auth/me should return 401 if no Authorization header provided', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/rides should return 401 if unauthenticated', async () => {
    const res = await request(app)
      .post('/api/v1/rides')
      .send({
        pickupZoneId: 1,
        destZoneId: 2,
        seats: 1,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/register should fail validation if email is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123',
        role: 'PASSENGER',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should fail validation if password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
