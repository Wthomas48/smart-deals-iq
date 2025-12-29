import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "weekly",
    name: "7-Day Ad",
    price: 7.99,
    duration: 7,
    description: "Promote your deals for 7 days",
  },
  {
    id: "monthly",
    name: "30-Day Ad",
    price: 29.99,
    duration: 30,
    description: "Promote your deals for 30 days",
  },
];

export interface Subscription {
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isSubscribed: boolean;
  daysRemaining: number;
  subscribe: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = "@smartdealsiq_subscription";

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
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
      console.error("Failed to load subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const newSubscription: Subscription = {
      planId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscription));
    setSubscription(newSubscription);
  };

  const cancelSubscription = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSubscription(null);
  };

  const isSubscribed = subscription?.isActive ?? false;

  const daysRemaining = subscription?.isActive
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isSubscribed,
        daysRemaining,
        subscribe,
        cancelSubscription,
        loading,
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
