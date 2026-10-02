import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Wallet Top-Up API Integration Tests', () => {
  it('POST /api/v1/wallet/topup/init should return 401 if unauthenticated', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/topup/init')
      .send({
        amountPaisa: 50000,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/wallet/topup/success should return 400 if val_id is missing when requested as JSON', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/topup/success')
      .set('Accept', 'application/json')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/wallet/topup/fail should redirect to frontend with failed status', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/topup/fail')
      .send({
        tran_id: 'DTP-NONEXISTENT',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toContain('/wallet?status=failed');
  });

  it('POST /api/v1/wallet/topup/cancel should redirect to frontend with cancelled status', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/topup/cancel')
      .send({
        tran_id: 'DTP-NONEXISTENT',
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toContain('/wallet?status=cancelled');
  });
});
