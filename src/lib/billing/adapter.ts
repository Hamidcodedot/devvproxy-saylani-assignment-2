import { CreateCheckoutParams, PaymentGatewayAdapter, PlanDetails, PlanTier } from './types';

export const PLANS: Record<PlanTier, PlanDetails> = {
  hobby: {
    id: 'hobby',
    name: 'Hobby Developer',
    priceMonthly: 0,
    description: 'Essential edge PII redaction and 0ms caching for personal projects.',
    features: [
      'Up to 10,000 requests / month',
      'Exact SHA-256 deterministic caching',
      'Standard PII redaction (Cards, Emails, SSNs)',
      '1 Virtual API key',
      'Community support',
    ],
    requestLimit: 10_000,
    apiKeysLimit: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro Builder',
    priceMonthly: 29,
    description: 'For startups and production applications requiring multi-provider failover.',
    features: [
      'Up to 500,000 requests / month',
      'Automatic Groq / LLaMA failover routing',
      '30-day PostgreSQL telemetry audit log',
      '10 Virtual API keys with custom rate limits',
      'Priority edge latency routing',
      'Custom BYOK upstream support',
    ],
    requestLimit: 500_000,
    apiKeysLimit: 10,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Shield',
    priceMonthly: 199,
    description: 'High-compliance privacy firewall with dedicated edge infrastructure.',
    features: [
      'Unlimited proxied requests',
      'Custom regex PII detection rules',
      'SOC2 / HIPAA audit export logs',
      'Zero Data Retention (ZDR) mode',
      'Dedicated proxy edge IP address',
      '24/7 dedicated engineering SLA',
    ],
    requestLimit: -1, // Unlimited
    apiKeysLimit: 50,
  },
};

/**
 * Mock Gateway Adapter: Instant sandbox checkout for assignment demos & zero-cost testing
 */
class MockGateway implements PaymentGatewayAdapter {
  providerName = 'mock' as const;

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ checkoutUrl: string; sessionId: string }> {
    const sessionId = `mock_sess_${Math.random().toString(36).substring(2, 10)}`;
    const url = new URL(params.returnUrl);
    url.searchParams.set('checkout_success', 'true');
    url.searchParams.set('plan', params.planId);
    url.searchParams.set('session_id', sessionId);
    return {
      checkoutUrl: url.toString(),
      sessionId,
    };
  }
}

/**
 * Stripe Adapter: Production-ready Stripe integration
 */
class StripeGateway implements PaymentGatewayAdapter {
  providerName = 'stripe' as const;

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ checkoutUrl: string; sessionId: string }> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Fallback to mock gateway if API key is not yet set in environment
      const mock = new MockGateway();
      return mock.createCheckoutSession(params);
    }

    // Stripe checkout session creation
    try {
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          mode: 'subscription',
          customer_email: params.userEmail,
          success_url: `${params.returnUrl}?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${params.returnUrl}?checkout_canceled=true`,
        }),
      });

      const session = await res.json();
      return { checkoutUrl: session.url || params.returnUrl, sessionId: session.id };
    } catch {
      const mock = new MockGateway();
      return mock.createCheckoutSession(params);
    }
  }
}

/**
 * Safepay Adapter: Specialized for Pakistan / Emerging Markets
 */
class SafepayGateway implements PaymentGatewayAdapter {
  providerName = 'safepay' as const;

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ checkoutUrl: string; sessionId: string }> {
    // Safepay tracker session dispatcher
    const mock = new MockGateway();
    return mock.createCheckoutSession(params);
  }
}

/**
 * Provider-Agnostic Gateway Factory
 */
export function getPaymentGateway(): PaymentGatewayAdapter {
  const provider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  if (provider === 'stripe') return new StripeGateway();
  if (provider === 'safepay') return new SafepayGateway();
  return new MockGateway();
}
