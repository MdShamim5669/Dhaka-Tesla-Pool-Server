export interface IWalletBalance {
  balancePaisa: number;
  display: string;
}

export interface ITopUpInput {
  amountPaisa: number;
}

export interface ITopUpInitResult {
  tranId: string;
  paymentUrl: string;
}

