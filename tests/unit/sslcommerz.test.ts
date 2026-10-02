import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sslcommerzService } from '../../src/modules/sslcommerz/sslcommerz.service.js';

describe('SSLCommerz Service Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initPayment should return paymentUrl and tranId on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'SUCCESS',
        sessionkey: 'test_session_123',
        GatewayPageURL: 'https://sandbox.sslcommerz.com/EasyCheckOut/testcde123',
      }),
    } as Response);

    const result = await sslcommerzService.initPayment({
      tranId: 'DTP-TEST-001',
      amount: 500,
      customerName: 'Test Passenger',
      customerEmail: 'test@example.com',
      customerPhone: '01711111111',
    });

    expect(result.paymentUrl).toBe('https://sandbox.sslcommerz.com/EasyCheckOut/testcde123');
    expect(result.tranId).toBe('DTP-TEST-001');
  });

  it('initPayment should throw AppError if gateway returns status !== SUCCESS', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'FAILED',
        failedreason: 'Store Credential Error',
      }),
    } as Response);

    await expect(
      sslcommerzService.initPayment({
        tranId: 'DTP-TEST-002',
        amount: 200,
        customerName: 'Test User',
        customerEmail: 'user@example.com',
      })
    ).rejects.toThrow('Store Credential Error');
  });

  it('validatePayment should return validation response when status is VALID', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'VALID',
        val_id: 'VALIDATION_123',
        tran_id: 'DTP-TEST-001',
        amount: '500.00',
        bank_tran_id: 'BANK_999',
        card_type: 'BKASH-BKash',
      }),
    } as Response);

    const res = await sslcommerzService.validatePayment('VALIDATION_123');
    expect(res.status).toBe('VALID');
    expect(res.amount).toBe('500.00');
    expect(res.val_id).toBe('VALIDATION_123');
  });

  it('validatePayment should throw when status is not VALID/VALIDATED', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'FAILED',
        error: 'Invalid validation ID',
      }),
    } as Response);

    await expect(sslcommerzService.validatePayment('INVALID_VAL')).rejects.toThrow(
      'Invalid validation ID'
    );
  });
});
