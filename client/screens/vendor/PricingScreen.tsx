import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription, SUBSCRIPTION_PLANS } from "@/lib/subscription-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function PricingScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { subscription, isSubscribed, daysRemaining, subscribe, loading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);

    Alert.alert(
      "Confirm Purchase",
      `Subscribe to ${plan.name} for $${plan.price.toFixed(2)}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setProcessing(false),
        },
        {
          text: "Purchase",
          onPress: async () => {
            await subscribe(selectedPlan);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", `You're now subscribed to the ${plan.name} plan!`);
            setProcessing(false);
            setSelectedPlan(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }]}>
        {isSubscribed ? (
          <Card style={styles.activeSubscription}>
            <View style={styles.subscriptionHeader}>
              <View style={[styles.activeIcon, { backgroundColor: Colors.success + "20" }]}>
                <Feather name="check-circle" size={24} color={Colors.success} />
              </View>
              <View style={styles.subscriptionInfo}>
                <ThemedText type="h4">Active Subscription</ThemedText>
                <ThemedText type="body" secondary>
                  {SUBSCRIPTION_PLANS.find((p) => p.id === subscription?.planId)?.name}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.daysRemaining, { backgroundColor: Colors.primary + "15" }]}>
              <ThemedText type="h2" style={{ color: Colors.primary }}>{daysRemaining}</ThemedText>
              <ThemedText type="small" secondary>days remaining</ThemedText>
            </View>
            <ThemedText type="caption" secondary style={styles.expiryText}>
              Expires: {subscription ? new Date(subscription.endDate).toLocaleDateString() : ""}
            </ThemedText>
          </Card>
        ) : (
          <>
            <View style={styles.header}>
              <ThemedText type="h3">Choose Your Plan</ThemedText>
              <Spacer size="sm" />
              <ThemedText type="body" secondary>
                Unlock AI-powered content creation and promote your deals
              </ThemedText>
            </View>

            <Spacer size="xl" />

            {SUBSCRIPTION_PLANS.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
              >
                <Card
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && { borderColor: Colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.planHeader}>
                    <View>
                      <ThemedText type="h4">{plan.name}</ThemedText>
                      <ThemedText type="small" secondary>{plan.description}</ThemedText>
                    </View>
                    <View style={styles.priceContainer}>
                      <ThemedText type="h2" style={{ color: Colors.primary }}>
                        ${plan.price.toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>

                  <Spacer size="md" />

                  <View style={styles.features}>
                    <View style={styles.featureRow}>
                      <Feather name="check" size={16} color={Colors.success} />
                      <ThemedText type="small" style={styles.featureText}>AI-powered promotion copy</ThemedText>
                    </View>
                    <View style={styles.featureRow}>
                      <Feather name="check" size={16} color={Colors.success} />
                      <ThemedText type="small" style={styles.featureText}>Voice input for promotions</ThemedText>
                    </View>
                    <View style={styles.featureRow}>
                      <Feather name="check" size={16} color={Colors.success} />
                      <ThemedText type="small" style={styles.featureText}>Priority visibility in feed</ThemedText>
                    </View>
                    <View style={styles.featureRow}>
                      <Feather name="check" size={16} color={Colors.success} />
                      <ThemedText type="small" style={styles.featureText}>{plan.duration}-day promotion period</ThemedText>
                    </View>
                  </View>

                  {selectedPlan === plan.id ? (
                    <View style={[styles.selectedBadge, { backgroundColor: Colors.primary }]}>
                      <Feather name="check" size={14} color="#fff" />
                      <ThemedText type="caption" style={{ color: "#fff", marginLeft: 4 }}>Selected</ThemedText>
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            ))}

            <Spacer size="xl" />

            <Pressable
              style={[
                styles.purchaseButton,
                { backgroundColor: selectedPlan ? Colors.primary : theme.backgroundTertiary },
              ]}
              onPress={handlePurchase}
              disabled={!selectedPlan || processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="body" style={{ color: selectedPlan ? "#fff" : theme.textSecondary, fontWeight: "600" }}>
                  {selectedPlan ? "Subscribe Now" : "Select a Plan"}
                </ThemedText>
              )}
            </Pressable>

            <Spacer size="md" />

            <ThemedText type="caption" secondary style={styles.disclaimer}>
              Payment will be processed securely. Cancel anytime.
            </ThemedText>
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
  },
  planCard: {
    marginBottom: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  features: {
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    flex: 1,
  },
  selectedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
  },
  purchaseButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  disclaimer: {
    textAlign: "center",
  },
  activeSubscription: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  activeIcon: {
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  subscriptionInfo: {
    alignItems: "flex-start",
  },
  daysRemaining: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  expiryText: {
    marginTop: Spacing.md,
  },
});
