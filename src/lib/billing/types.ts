export type PlanTier = 'hobby' | 'pro' | 'enterprise';

export interface PlanDetails {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  requestLimit: number;
  apiKeysLimit: number;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: PlanTier;
  status: 'active' | 'canceled' | 'past_due';
  provider: 'stripe' | 'safepay' | 'manual';
  customerId?: string;
  currentPeriodEnd?: string;
}

export interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  planId: PlanTier;
  returnUrl: string;
}

export interface PaymentGatewayAdapter {
  providerName: 'stripe' | 'safepay' | 'mock';
  createCheckoutSession(params: CreateCheckoutParams): Promise<{ checkoutUrl: string; sessionId: string }>;
}
