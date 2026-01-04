import type { Express, Request, Response } from "express";
import Stripe from "stripe";

// Lazy-initialized Stripe client to prevent crashes when API key is not set
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// Product/Price IDs - these should match your Stripe Dashboard
// You'll need to create these products in Stripe and update these IDs
const STRIPE_PRODUCTS = {
  prod_free: {
    priceId: null, // Free tier, no payment needed
    name: "Free Tier",
  },
  prod_starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
    name: "Starter",
  },
  prod_monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || "price_monthly",
    name: "Pro Monthly",
  },
  prod_yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || "price_yearly",
    name: "Pro Annual",
  },
};

// In-memory subscription store (replace with database in production)
const subscriptions = new Map<string, {
  id: string;
  vendorId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  productId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}>();

// In-memory payment history (replace with database in production)
const paymentHistory = new Map<string, Array<{
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  invoicePdf?: string;
}>>();

export function registerPaymentRoutes(app: Express) {
  // Create Stripe Checkout Session for subscription
  app.post("/api/payments/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { productId, vendorId, vendorEmail, successUrl, cancelUrl } = req.body;

      if (!productId || !vendorId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const product = STRIPE_PRODUCTS[productId as keyof typeof STRIPE_PRODUCTS];
      if (!product || !product.priceId) {
        return res.status(400).json({ error: "Invalid product or free tier selected" });
      }

      // Create or retrieve Stripe customer
      let customer: Stripe.Customer;
      const existingCustomers = await getStripe().customers.list({
        email: vendorEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await getStripe().customers.create({
          email: vendorEmail,
          metadata: { vendorId },
        });
      }

      // First, verify the price exists and check if it's recurring or one-time
      let priceData;
      try {
        priceData = await getStripe().prices.retrieve(product.priceId as string);
        console.log(`[Stripe] Price ${product.priceId} type: ${priceData.type}, recurring: ${priceData.recurring ? 'yes' : 'no'}`);
      } catch (priceError: any) {
        console.error(`[Stripe] Failed to retrieve price ${product.priceId}:`, priceError.message);
        return res.status(400).json({
          error: `Invalid Stripe Price ID: ${product.priceId}. Please check your Stripe Dashboard.`
        });
      }

      // Determine checkout mode based on price type
      const isRecurring = priceData.type === 'recurring';
      const checkoutMode = isRecurring ? 'subscription' : 'payment';
      console.log(`[Stripe] Creating ${checkoutMode} checkout for ${productId}`);

      // Build session config
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [
          {
            price: product.priceId,
            quantity: 1,
          },
        ],
        mode: checkoutMode,
        success_url: successUrl || `${process.env.EXPO_PUBLIC_API_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.EXPO_PUBLIC_API_URL}/payment-cancelled`,
        metadata: {
          vendorId,
          productId,
        },
      };

      // Add subscription_data only for recurring payments
      if (isRecurring) {
        sessionConfig.subscription_data = {
          metadata: {
            vendorId,
            productId,
          },
        };
      }

      // Create checkout session
      const session = await getStripe().checkout.sessions.create(sessionConfig);

      res.json({
        id: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create Payment Intent for one-time payments
  app.post("/api/payments/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { amount, currency = "usd", vendorId } = req.body;

      if (!amount || !vendorId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(amount), // Amount in cents
        currency,
        metadata: { vendorId },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } catch (error) {
      console.error("Payment intent error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Verify payment status
  app.get("/api/payments/verify/:paymentIntentId", async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.params;

      const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

      res.json({
        success: paymentIntent.status === "succeeded",
        status: paymentIntent.status,
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ success: false, status: "error", error: "Verification failed" });
    }
  });

  // Get customer payment methods
  app.get("/api/payments/methods/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;

      const paymentMethods = await getStripe().paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      const methods = paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
      }));

      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json([]);
    }
  });

  // Get billing history for vendor
  app.get("/api/payments/history/:vendorId", async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      // Get subscription for vendor
      const subscription = Array.from(subscriptions.values()).find(
        (sub) => sub.vendorId === vendorId
      );

      if (!subscription) {
        return res.json([]);
      }

      // Fetch invoices from Stripe
      const invoices = await getStripe().invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 20,
      });

      const history = invoices.data.map((invoice) => ({
        id: invoice.id,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        status: invoice.status,
        created: new Date(invoice.created * 1000).toISOString(),
        invoicePdf: invoice.invoice_pdf,
      }));

      res.json(history);
    } catch (error) {
      console.error("Get billing history error:", error);
      res.status(500).json([]);
    }
  });

  // Get subscription details for vendor
  app.get("/api/subscriptions/vendor/:vendorId", async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const subscription = Array.from(subscriptions.values()).find(
        (sub) => sub.vendorId === vendorId
      );

      if (!subscription) {
        return res.status(404).json(null);
      }

      // Fetch latest status from Stripe
      const stripeSubscription = await getStripe().subscriptions.retrieve(
        subscription.stripeSubscriptionId
      ) as Stripe.Subscription;

      res.json({
        id: subscription.id,
        status: stripeSubscription.status,
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        plan: {
          id: subscription.productId,
          name: STRIPE_PRODUCTS[subscription.productId as keyof typeof STRIPE_PRODUCTS]?.name || "Unknown",
        },
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json(null);
    }
  });

  // Cancel subscription
  app.post("/api/subscriptions/:subscriptionId/cancel", async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;

      // Find subscription in our store
      const subscription = subscriptions.get(subscriptionId);

      if (subscription) {
        // Cancel at period end (user keeps access until end of billing period)
        await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        subscription.cancelAtPeriodEnd = true;
        subscriptions.set(subscriptionId, subscription);
      } else {
        // Try to cancel directly with Stripe subscription ID
        await getStripe().subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ success: false, error: "Failed to cancel subscription" });
    }
  });

  // Stripe Webhook Handler
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = getStripe().webhooks.constructEvent(
          req.rawBody as Buffer,
          sig,
          webhookSecret
        );
      } else {
        // For testing without signature verification
        event = req.body as Stripe.Event;
      }
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);

        // Get subscription details
        if (session.subscription && session.metadata) {
          const stripeSubscription = await getStripe().subscriptions.retrieve(
            session.subscription as string
          ) as Stripe.Subscription;

          const subscriptionData = {
            id: `sub_${Date.now()}`,
            vendorId: session.metadata.vendorId,
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: session.customer as string,
            productId: session.metadata.productId,
            status: stripeSubscription.status,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            createdAt: new Date(),
          };

          subscriptions.set(subscriptionData.id, subscriptionData);
          console.log("Subscription created:", subscriptionData.id);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        // Update local subscription record
        const existing = Array.from(subscriptions.values()).find(
          (sub) => sub.stripeSubscriptionId === subscription.id
        );

        if (existing) {
          existing.status = subscription.status;
          existing.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
          existing.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          subscriptions.set(existing.id, existing);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        // Remove from local store
        const existing = Array.from(subscriptions.entries()).find(
          ([_, sub]) => sub.stripeSubscriptionId === subscription.id
        );

        if (existing) {
          subscriptions.delete(existing[0]);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice paid:", invoice.id);

        // Record payment in history
        const vendorId = (invoice as any).subscription_details?.metadata?.vendorId;
        if (vendorId) {
          const history = paymentHistory.get(vendorId) || [];
          history.push({
            id: invoice.id,
            vendorId,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency,
            status: invoice.status || "paid",
            created: new Date(invoice.created * 1000),
            invoicePdf: invoice.invoice_pdf || undefined,
          });
          paymentHistory.set(vendorId, history);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);
        // TODO: Send notification to vendor about failed payment
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  });

  console.log("Payment routes registered");
}
