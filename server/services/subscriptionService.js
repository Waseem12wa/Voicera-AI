const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

// PayPal configuration
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

class SubscriptionService {
  constructor() {
    this.plans = {
      basic: {
        name: 'Basic Plan',
        price: 9.99,
        features: ['5 hours voice processing', 'Basic translation', 'Email support'],
        limits: { voiceHours: 5, translations: 100 }
      },
      pro: {
        name: 'Pro Plan',
        price: 29.99,
        features: ['20 hours voice processing', 'Advanced translation', 'Priority support', 'API access'],
        limits: { voiceHours: 20, translations: 500 }
      },
      enterprise: {
        name: 'Enterprise Plan',
        price: 99.99,
        features: ['Unlimited voice processing', 'All translations', '24/7 support', 'Custom integrations'],
        limits: { voiceHours: -1, translations: -1 }
      }
    };
  }

  // Create Stripe subscription
  async createStripeSubscription(customerId, planId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      throw new Error(`Stripe subscription failed: ${error.message}`);
    }
  }

  // Create PayPal subscription
  async createPayPalSubscription(planId) {
    try {
      const request = new paypal.subscriptions.SubscriptionsCreateRequest();
      request.requestBody({
        plan_id: planId,
        subscriber: {
          email_address: 'customer@example.com'
        },
        application_context: {
          brand_name: 'Voicera AI',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: 'https://your-domain.com/success',
          cancel_url: 'https://your-domain.com/cancel'
        }
      });

      const response = await client.execute(request);
      return {
        success: true,
        subscriptionId: response.result.id,
        approvalUrl: response.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      throw new Error(`PayPal subscription failed: ${error.message}`);
    }
  }

  // Check subscription status
  async checkSubscriptionStatus(userId) {
    // Implementation to check user's subscription status
    // This would query your database for subscription info
    return {
      isActive: true,
      plan: 'pro',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      features: this.plans.pro.features
    };
  }

  // Validate feature access
  async validateFeatureAccess(userId, feature) {
    const subscription = await this.checkSubscriptionStatus(userId);
    
    if (!subscription.isActive) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const plan = this.plans[subscription.plan];
    if (!plan.features.includes(feature)) {
      return { allowed: false, reason: 'Feature not included in current plan' };
    }

    return { allowed: true };
  }
}

module.exports = SubscriptionService;
