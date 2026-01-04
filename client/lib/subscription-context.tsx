import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./auth-context";
import {
  STRIPE_PRODUCTS,
  StripeProduct,
  createCheckoutSession,
  openStripeCheckout,
  simulatePayment,
  cancelSubscription as stripeCancelSubscription,
  formatPrice,
  PRO_FEATURES,
  getSubscriptionDetails,
} from "./stripe-service";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  features?: string[];
  interval?: "month" | "year" | "week" | "day";
  savings?: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "prod_free",
    name: "Free Tier",
    price: 0,
    duration: 0,
    description: "Basic listing on map",
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
    price: 7.99,
    duration: 7,
    description: "One-time featured listing",
    interval: undefined, // One-time payment, not recurring
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
    price: 29.99,
    duration: 30,
    description: "Full-featured for growing businesses",
    interval: "month",
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
    price: 287.88,
    duration: 365,
    description: "Best value - save 20%",
    interval: "year",
    savings: 20,
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

export interface Subscription {
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isSubscribed: boolean;
  isPro: boolean;
  daysRemaining: number;
  subscribe: (planId: string, vendorEmail?: string) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  loading: boolean;
  plans: SubscriptionPlan[];
  formatPrice: typeof formatPrice;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = "@smartdealsiq_subscription";

// Demo mode - set to true for testing without Stripe, false for production
const USE_DEMO_MODE = false;

// Enable all features - set to true for full access, false to enforce subscription checks
const ENABLE_ALL_FEATURES = false;

export { PRO_FEATURES };

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [isAuthenticated]);

  const loadSubscription = async () => {
    try {
      // First try to load from server if user is authenticated
      if (isAuthenticated && user?.id) {
        try {
          const serverSub = await getSubscriptionDetails(user.id);
          if (serverSub) {
            const newSubscription: Subscription = {
              planId: serverSub.plan.id,
              startDate: new Date().toISOString(),
              endDate: serverSub.currentPeriodEnd,
              isActive: serverSub.status === "active",
              stripeSubscriptionId: serverSub.id,
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscription));
            setSubscription(newSubscription);
            if (__DEV__) console.log("[Subscription] Loaded from server:", serverSub.plan.name);
            return;
          }
        } catch (serverError) {
          if (__DEV__) console.log("[Subscription] Server fetch failed, using local cache");
        }
      }

      // Fall back to local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const sub = JSON.parse(stored) as Subscription;
        const endDate = new Date(sub.endDate);
        const now = new Date();
        if (endDate > now) {
          setSubscription({ ...sub, isActive: true });
        } else {
          setSubscription({ ...sub, isActive: false });
        }
      }
    } catch (error) {
      console.error("[Subscription] Failed to load:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (planId: string, vendorEmail?: string): Promise<boolean> => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      console.error("[Subscription] Plan not found:", planId);
      return false;
    }

    // Get user info from auth
    const userId = user?.id || "guest_user";
    const userEmail = vendorEmail || user?.email || "guest@example.com";

    // Free tier doesn't require payment
    if (planId === "prod_free") {
      const newSubscription: Subscription = {
        planId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 100).toISOString(), // 100 years
        isActive: true,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscription));
      setSubscription(newSubscription);
      if (__DEV__) console.log("[Subscription] Free tier activated for:", userEmail);
      return true;
    }

    try {
      if (USE_DEMO_MODE) {
        // Demo mode - simulate payment
        if (__DEV__) console.log("[Subscription] Using demo mode for payment simulation");
        const result = await simulatePayment(planId, userId);

        const newSubscription: Subscription = {
          planId,
          startDate: new Date().toISOString(),
          endDate: result.expiresAt,
          isActive: true,
          stripeSubscriptionId: result.subscriptionId,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscription));
        setSubscription(newSubscription);
        if (__DEV__) console.log("[Subscription] Demo subscription created:", planId);
        return true;
      } else {
        // Real Stripe checkout
        if (__DEV__) console.log("[Subscription] Creating Stripe checkout session for:", userEmail);
        const session = await createCheckoutSession(planId, userId, userEmail);

        if (!session.url) {
          console.error("[Subscription] No checkout URL returned");
          return false;
        }

        if (__DEV__) console.log("[Subscription] Opening Stripe checkout:", session.url);
        const opened = await openStripeCheckout(session.url);

        if (opened) {
          // Payment verification happens via webhook on server
          // For immediate feedback, we optimistically set subscription
          const startDate = new Date();
          const endDate = new Date();
          if (plan.interval === "year") {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          const newSubscription: Subscription = {
            planId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
            stripeSubscriptionId: session.id,
          };

          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscription));
          setSubscription(newSubscription);
          if (__DEV__) console.log("[Subscription] Stripe checkout initiated:", planId);
          return true;
        }
        if (__DEV__) console.log("[Subscription] Stripe checkout was cancelled or failed");
        return false;
      }
    } catch (error) {
      console.error("[Subscription] Error:", error);
      return false;
    }
  };

  const cancelSubscription = async () => {
    try {
      if (subscription?.stripeSubscriptionId && !USE_DEMO_MODE) {
        await stripeCancelSubscription(subscription.stripeSubscriptionId);
      }
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSubscription(null);
    } catch (error) {
      console.error("Cancel subscription error:", error);
    }
  };

  // Check if user has a specific pro feature
  const hasFeature = (feature: string): boolean => {
    // Enable all features when flag is set
    if (ENABLE_ALL_FEATURES) return true;

    if (!subscription?.isActive) return false;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
    if (!plan) return false;

    // Free tier has no pro features
    if (plan.id === "prod_free") {
      return false;
    }

    // Starter has limited features
    if (plan.id === "prod_starter") {
      const starterFeatures = ["featured_pin", "basic_analytics"];
      return starterFeatures.includes(feature);
    }

    // Monthly and yearly have all pro features
    return true;
  };

  // Check subscription status
  const isSubscribed = ENABLE_ALL_FEATURES || (subscription?.isActive ?? false);

  // Pro subscription (monthly or yearly)
  const isPro = ENABLE_ALL_FEATURES || (isSubscribed && (
    subscription?.planId === "prod_monthly" ||
    subscription?.planId === "prod_yearly"
  ));

  const daysRemaining = subscription?.isActive
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isSubscribed,
        isPro,
        daysRemaining,
        subscribe,
        cancelSubscription,
        hasFeature,
        loading,
        plans: SUBSCRIPTION_PLANS,
        formatPrice,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
