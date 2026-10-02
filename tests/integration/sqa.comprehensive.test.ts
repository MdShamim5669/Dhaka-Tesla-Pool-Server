import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { tokenUtils } from '../../src/utils/tokens.js';

describe('SQA Comprehensive API Endpoints Audit', () => {
  let passengerToken: string;
  let driverToken: string;
  const dummyPassengerId = '11111111-1111-1111-1111-111111111111';
  const dummyDriverId = '22222222-2222-2222-2222-222222222222';

  beforeAll(() => {
    passengerToken = tokenUtils.generateAccessToken(dummyPassengerId, 'PASSENGER');
    driverToken = tokenUtils.generateAccessToken(dummyDriverId, 'DRIVER');
  });

  describe('1. Public & Discovery Endpoints', () => {
    it('GET /api/v1/health should return 200 and database status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.database).toBe('connected');
    }, 15000);

    it('GET /api/v1/zones should return 200 and list of active zones', async () => {
      const res = await request(app).get('/api/v1/zones');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/v1/auth/logout should return 200', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/undefined-endpoint should return 404 Not Found', async () => {
      const res = await request(app).get('/api/v1/undefined-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Authentication Enforcement (401 Unauthorized)', () => {
    const protectedRoutes = [
      { method: 'get', url: '/api/v1/auth/me' },
      { method: 'post', url: '/api/v1/rides' },
      { method: 'get', url: '/api/v1/rides' },
      { method: 'get', url: '/api/v1/rides/11111111-1111-1111-1111-111111111111' },
      { method: 'post', url: '/api/v1/rides/11111111-1111-1111-1111-111111111111/cancel' },
      { method: 'patch', url: '/api/v1/drivers/me/availability' },
      { method: 'get', url: '/api/v1/drivers/me/tesla' },
      { method: 'get', url: '/api/v1/driver/requests' },
      { method: 'post', url: '/api/v1/driver/requests/11111111-1111-1111-1111-111111111111/accept' },
      { method: 'get', url: '/api/v1/driver/pools/current' },
      { method: 'post', url: '/api/v1/driver/pools/11111111-1111-1111-1111-111111111111/arrive' },
      { method: 'post', url: '/api/v1/driver/pools/11111111-1111-1111-1111-111111111111/start' },
      { method: 'post', url: '/api/v1/driver/pools/11111111-1111-1111-1111-111111111111/complete' },
      { method: 'post', url: '/api/v1/driver/pools/11111111-1111-1111-1111-111111111111/cancel' },
      { method: 'get', url: '/api/v1/driver/pools' },
      { method: 'get', url: '/api/v1/wallet' },
      { method: 'post', url: '/api/v1/wallet/topup/init' },
    ];

    protectedRoutes.forEach(({ method, url }) => {
      it(`${method.toUpperCase()} ${url} should reject with 401 when no token is passed`, async () => {
        const req = (request(app) as any)[method](url);
        const res = await req;
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it(`${method.toUpperCase()} ${url} should reject with 401 when invalid token is passed`, async () => {
        const req = (request(app) as any)[method](url).set('Authorization', 'Bearer invalid.token.signature');
        const res = await req;
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('3. Role-Based Access Control (403 Forbidden)', () => {
    it('Passenger should be FORBIDDEN (403) from Driver availability route', async () => {
      const res = await request(app)
        .patch('/api/v1/drivers/me/availability')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ isAvailable: true });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Passenger should be FORBIDDEN (403) from Driver requests queue', async () => {
      const res = await request(app)
        .get('/api/v1/driver/requests')
        .set('Authorization', `Bearer ${passengerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Passenger should be FORBIDDEN (403) from Driver current pool', async () => {
      const res = await request(app)
        .get('/api/v1/driver/pools/current')
        .set('Authorization', `Bearer ${passengerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Driver should be FORBIDDEN (403) from Passenger ride creation', async () => {
      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ pickupZoneId: 1, destZoneId: 2, seats: 1 });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Driver should be FORBIDDEN (403) from Passenger rides history', async () => {
      const res = await request(app)
        .get('/api/v1/rides')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Input Validation & Boundaries (400 Bad Request)', () => {
    it('POST /api/v1/auth/register should fail on short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'SQA Test',
          email: 'sqa@example.com',
          password: '123',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/register should fail on malformed email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'SQA Test',
          email: 'invalid-email-format',
          password: 'password123',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login should fail on missing email or password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/fares/estimate should fail when pickup and dest zones are identical', async () => {
      const res = await request(app)
        .post('/api/v1/fares/estimate')
        .send({ pickupZoneId: 1, destZoneId: 1, seats: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/rides should fail with validation error on empty payload', async () => {
      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/rides should fail when seats is 0 or negative', async () => {
      const res = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ pickupZoneId: 1, destZoneId: 2, seats: 0 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/wallet/topup/init should reject amount below minimum ৳10 (1000 paisa)', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup/init')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ amountPaisa: 500 }); // only ৳5
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/wallet/topup/init should reject amount above maximum ৳25,000 (2500000 paisa)', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup/init')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ amountPaisa: 3000000 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Payment Callbacks & Webhook Integrity', () => {
    it('POST /api/v1/wallet/topup/fail should handle cancellation/failure and redirect with 302', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup/fail')
        .send({ tran_id: 'DTP-SQA-FAIL-01' });
      expect(res.status).toBe(302);
      expect(res.header.location).toContain('/wallet?status=failed');
    });

    it('POST /api/v1/wallet/topup/cancel should handle user cancellation and redirect with 302', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup/cancel')
        .send({ tran_id: 'DTP-SQA-CANCEL-01' });
      expect(res.status).toBe(302);
      expect(res.header.location).toContain('/wallet?status=cancelled');
    });

    it('POST /api/v1/wallet/topup/ipn should handle background IPN payload gracefully', async () => {
      const res = await request(app)
        .post('/api/v1/wallet/topup/ipn')
        .send({
          status: 'FAILED',
          tran_id: 'DTP-SQA-IPN-01',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
