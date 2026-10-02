import { env } from '../../config/env.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import {
  SSLCommerzInitPayload,
  SSLCommerzInitResponse,
  SSLCommerzValidationResponse,
} from './sslcommerz.types.js';

export class SSLCommerzService {
  private get baseUrl(): string {
    return env.SSLCOMMERZ_IS_LIVE
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';
  }

  /**
   * Initializes a payment session with SSLCommerz and returns the checkout GatewayPageURL.
   */
  async initPayment(payload: SSLCommerzInitPayload): Promise<{ paymentUrl: string; tranId: string; sessionKey?: string }> {
    const initUrl = `${this.baseUrl}/gwprocess/v4/api.php`;

    const bodyParams = new URLSearchParams({
      store_id: env.SSLCOMMERZ_STORE_ID,
      store_passwd: env.SSLCOMMERZ_STORE_PASS,
      total_amount: payload.amount.toFixed(2),
      currency: 'BDT',
      tran_id: payload.tranId,
      success_url: env.SSLCOMMERZ_SUCCESS_URL,
      fail_url: env.SSLCOMMERZ_FAIL_URL,
      cancel_url: env.SSLCOMMERZ_CANCEL_URL,
      ipn_url: env.SSLCOMMERZ_IPN_URL,
      shipping_method: 'NO',
      product_name: payload.productName || 'TeslaPay Wallet TopUp',
      product_category: 'TopUp',
      product_profile: 'general',
      cus_name: payload.customerName || 'Passenger',
      cus_email: payload.customerEmail || 'passenger@dhakateslapool.com',
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: payload.customerPhone || '01700000000',
    });

    try {
      const response = await fetch(initUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        throw new Error(`SSLCommerz HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as SSLCommerzInitResponse;

      if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
        logger.error({ data }, 'SSLCommerz session initialization failed');
        throw new AppError(
          502,
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          data.failedreason || 'Failed to initialize SSLCommerz payment gateway session'
        );
      }

      return {
        paymentUrl: data.GatewayPageURL,
        tranId: payload.tranId,
        sessionKey: data.sessionkey,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, 'SSLCommerz payment init exception');
      throw new AppError(502, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Payment gateway unreachable');
    }
  }

  /**
   * Validates a completed transaction with SSLCommerz using the validation server API.
   */
  async validatePayment(valId: string): Promise<SSLCommerzValidationResponse> {
    if (!valId) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation ID (val_id) is required');
    }

    const validationUrl = new URL(`${this.baseUrl}/validator/api/validationserverAPI.php`);
    validationUrl.searchParams.set('val_id', valId);
    validationUrl.searchParams.set('store_id', env.SSLCOMMERZ_STORE_ID);
    validationUrl.searchParams.set('store_passwd', env.SSLCOMMERZ_STORE_PASS);
    validationUrl.searchParams.set('format', 'json');

    try {
      const response = await fetch(validationUrl.toString());

      if (!response.ok) {
        throw new Error(`SSLCommerz validation HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as SSLCommerzValidationResponse;

      if (!data || (data.status !== 'VALID' && data.status !== 'VALIDATED')) {
        logger.warn({ data }, 'SSLCommerz payment validation failed or invalid status');
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          data?.error || `Payment validation failed with status: ${data?.status || 'UNKNOWN'}`
        );
      }

      return data;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, 'SSLCommerz validation error');
      throw new AppError(502, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Unable to validate payment with gateway');
    }
  }
}

export const sslcommerzService = new SSLCommerzService();
