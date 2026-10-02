import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

describe('Health and System Integration Tests', () => {

  it('GET /api/v1/health should respond with status code 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
  }, 20000);

  it('GET /api/v1/non-existent-route should return 404', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

