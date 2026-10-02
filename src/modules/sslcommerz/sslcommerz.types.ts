export interface SSLCommerzInitPayload {
  tranId: string;
  amount: number; // in BDT (e.g. 500.00)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productName?: string;
}

export interface SSLCommerzInitResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
  [key: string]: unknown;
}

export interface SSLCommerzValidationResponse {
  status: 'VALID' | 'VALIDATED' | 'FAILED' | 'CANCELLED' | string;
  tran_date?: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount?: string;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  card_issuer?: string;
  card_brand?: string;
  error?: string;
  [key: string]: unknown;
}
