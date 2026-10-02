import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Fares API Integration Tests', () => {
  it('POST /api/v1/fares/estimate should fail with 400 when body fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/fares/estimate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('pickupZoneId, destZoneId, and seats are required');
  });

  it('POST /api/v1/fares/estimate should fail with 400 when pickup and dest zones are identical', async () => {
    const res = await request(app)
      .post('/api/v1/fares/estimate')
      .send({
        pickupZoneId: 1,
        destZoneId: 1,
        seats: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Pickup and destination zones must be different');
  });
});
