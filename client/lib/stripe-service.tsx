import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

// Demo mode - matches auth-context setting
const DEMO_MODE_ENABLED = false;

// Stripe configuration
const STRIPE_CONFIG = {
  // Replace with your Stripe publishable key
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_xxxxx",
  // Replace with your backend API URL
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000",
};

export interface PaymentIntent {
  clientSecret: string;
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: "month" | "year" | "week" | "day";
  intervalCount?: number;
  features: string[];
}

// Available subscription products
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: "prod_free",
    name: "Free Tier",
    description: "Basic listing on map",
    price: 0,
    currency: "usd",
    features: [
      "Business listing on map",
      "1 location update per hour",
      "Standard map pin",
      "Basic profile",
    ],
  },
  {
    id: "prod_starter",
    name: "7-Day Ad",
    description: "One-time featured listing",
    price: 7.99,
    currency: "usd",
    interval: undefined, // One-time payment, not recurring
    intervalCount: undefined,
    features: [
      "7 days featured listing",
      "3 active promotions",
      "Unlimited location updates",
      "Featured map pin",
      "Basic analytics",
    ],
  },
  {
    id: "prod_monthly",
    name: "Pro Monthly",
    description: "Full-featured for growing businesses",
    price: 29.99,
    currency: "usd",
    interval: "month",
    intervalCount: 1,
    features: [
      "Unlimited promotions",
      "Flash deal notifications",
      "Advanced analytics dashboard",
      "Priority support",
      "Barcode/QR generator",
      "Flyer & menu designer",
      "Voice input for promotions",
      "AI-powered suggestions",
    ],
  },
  {
    id: "prod_yearly",
    name: "Pro Annual",
    description: "Best value - save 20%",
    price: 287.88,
    currency: "usd",
    interval: "year",
    intervalCount: 1,
    features: [
      "Everything in Pro Monthly",
      "Save 20% ($71.88/year)",
      "Priority feature requests",
      "Dedicated account manager",
      "Custom branding options",
      "API access for integrations",
      "Multi-location support",
      "White-label options",
    ],
  },
];

// Pro features available with subscription
export const PRO_FEATURES = {
  UNLIMITED_PROMOTIONS: "unlimited_promotions",
  FLASH_DEALS: "flash_deals",
  ADVANCED_ANALYTICS: "advanced_analytics",
  BARCODE_GENERATOR: "barcode_generator",
  FLYER_DESIGNER: "flyer_designer",
  MENU_PRINTER: "menu_printer",
  PRIORITY_SUPPORT: "priority_support",
  CUSTOM_BRANDING: "custom_branding",
  API_ACCESS: "api_access",
  VOICE_INPUT: "voice_input",
  AI_SUGGESTIONS: "ai_suggestions",
  FEATURED_PIN: "featured_pin",
  MULTI_LOCATION: "multi_location",
  WHITE_LABEL: "white_label",
};

// Payment method types
export type PaymentMethod = "card" | "apple_pay" | "google_pay";

// Create a checkout session for subscription
export async function createCheckoutSession(
  productId: string,
  vendorId: string,
  vendorEmail: string
): Promise<CheckoutSession> {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        vendorId,
        vendorEmail,
        successUrl: Linking.createURL("/payment-success"),
        cancelUrl: Linking.createURL("/payment-cancelled"),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    return await response.json();
  } catch (error) {
    console.error("Checkout session error:", error);
    throw error;
  }
}

// Open Stripe Checkout in web browser
export async function openStripeCheckout(checkoutUrl: string): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      // On web, open in new tab
      window.open(checkoutUrl, "_blank");
      return true;
    } else {
      // On mobile, use Expo WebBrowser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        dismissButtonStyle: "close",
      });
      return result.type === "opened" || result.type === "dismiss";
    }
  } catch (error) {
    console.error("Error opening checkout:", error);
    return false;
  }
}

// Create a payment intent for one-time payments
export async function createPaymentIntent(
  amount: number,
  currency: string = "usd",
  vendorId: string
): Promise<PaymentIntent> {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        vendorId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    return await response.json();
  } catch (error) {
    console.error("Payment intent error:", error);
    throw error;
  }
}

// Verify payment status
export async function verifyPayment(paymentIntentId: string): Promise<{
  success: boolean;
  status: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/verify/${paymentIntentId}`);

    if (!response.ok) {
      throw new Error("Failed to verify payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Payment verification error:", error);
    return { success: false, status: "error", error: String(error) };
  }
}

// Get customer's payment methods
export async function getPaymentMethods(customerId: string): Promise<{
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}[]> {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/methods/${customerId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch payment methods");
    }

    return await response.json();
  } catch (error) {
    console.error("Get payment methods error:", error);
    return [];
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel subscription");
    }

    return true;
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return false;
  }
}

// Get subscription details
export async function getSubscriptionDetails(vendorId: string): Promise<{
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: StripeProduct;
} | null> {
  // Return demo data in demo mode
  if (DEMO_MODE_ENABLED) {
    return {
      id: `demo_sub_${vendorId}`,
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      plan: STRIPE_PRODUCTS[0], // Free tier
    };
  }

  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/subscriptions/vendor/${vendorId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Get subscription error:", error);
    return null;
  }
}

// Get billing history
export async function getBillingHistory(vendorId: string): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  invoicePdf?: string;
}[]> {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/history/${vendorId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch billing history");
    }

    return await response.json();
  } catch (error) {
    console.error("Get billing history error:", error);
    return [];
  }
}

// Format price for display
export function formatPrice(amount: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

// Calculate savings for annual plan
export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): {
  savings: number;
  savingsPercent: number;
} {
  const regularAnnual = monthlyPrice * 12;
  const savings = regularAnnual - annualPrice;
  const savingsPercent = Math.round((savings / regularAnnual) * 100);
  return { savings, savingsPercent };
}

// Demo mode payment simulation (for testing without real Stripe)
export async function simulatePayment(
  productId: string,
  vendorId: string
): Promise<{
  success: boolean;
  subscriptionId: string;
  expiresAt: string;
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const product = STRIPE_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Calculate expiration based on product
  const expiresAt = new Date();
  if (product.id === "prod_free") {
    // Free tier - no expiration (set to far future)
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  } else if (product.interval === "month") {
    expiresAt.setMonth(expiresAt.getMonth() + (product.intervalCount || 1));
  } else if (product.interval === "year") {
    expiresAt.setFullYear(expiresAt.getFullYear() + (product.intervalCount || 1));
  } else if (product.interval === "week") {
    expiresAt.setDate(expiresAt.getDate() + 7 * (product.intervalCount || 1));
  } else if (product.interval === "day") {
    expiresAt.setDate(expiresAt.getDate() + (product.intervalCount || 1));
  } else {
    // Default to 30 days
    expiresAt.setDate(expiresAt.getDate() + 30);
  }

  return {
    success: true,
    subscriptionId: `sub_demo_${Date.now()}`,
    expiresAt: expiresAt.toISOString(),
  };
}
