import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/lib/subscription-context";
import { useAuth } from "@/lib/auth-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(style);
  }
};

const triggerNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(type);
  }
};

export default function PricingScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    subscription,
    isSubscribed,
    isPro,
    daysRemaining,
    subscribe,
    cancelSubscription,
    loading,
    plans,
    formatPrice,
  } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);

    // Free tier - no confirmation needed
    if (plan.price === 0) {
      const success = await subscribe(selectedPlan, user?.email);
      if (success) {
        triggerNotification(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Free tier activated! You can now list your business on the map.");
      }
      setProcessing(false);
      setSelectedPlan(null);
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Subscribe to ${plan.name} for ${formatPrice(plan.price)}${plan.interval ? `/${plan.interval}` : ""}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setProcessing(false),
        },
        {
          text: "Purchase",
          onPress: async () => {
            const success = await subscribe(selectedPlan, user?.email);
            if (success) {
              triggerNotification(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", `You're now subscribed to the ${plan.name} plan!`);
            } else {
              triggerNotification(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Payment failed. Please try again.");
            }
            setProcessing(false);
            setSelectedPlan(null);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You'll lose access to Pro features.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            await cancelSubscription();
            triggerNotification(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Subscription Cancelled", "Your subscription has been cancelled.");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: headerHeight }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Back Button Header */}
      <View style={[styles.backHeader, { paddingTop: headerHeight + Spacing.sm }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>Back</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.md, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isSubscribed ? (
          <>
            <Card style={styles.activeSubscription}>
              <View style={styles.subscriptionHeader}>
                <View style={[styles.activeIcon, { backgroundColor: Colors.success + "20" }]}>
                  <Feather name="check-circle" size={24} color={Colors.success} />
                </View>
                <View style={styles.subscriptionInfo}>
                  <ThemedText type="h4">Active Subscription</ThemedText>
                  <ThemedText type="body" secondary>
                    {plans.find((p) => p.id === subscription?.planId)?.name}
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.daysRemaining, { backgroundColor: Colors.primary + "15" }]}>
                <ThemedText type="h2" style={{ color: Colors.primary }}>
                  {daysRemaining}
                </ThemedText>
                <ThemedText type="small" secondary>
                  days remaining
                </ThemedText>
              </View>

              <ThemedText type="caption" secondary style={styles.expiryText}>
                Expires: {subscription ? new Date(subscription.endDate).toLocaleDateString() : ""}
              </ThemedText>

              {isPro && (
                <View style={styles.proFeatures}>
                  <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
                    Your Pro Features:
                  </ThemedText>
                  <View style={styles.featureGrid}>
                    <View style={styles.featureItem}>
                      <Feather name="zap" size={16} color={Colors.primary} />
                      <ThemedText type="caption">Flash Deals</ThemedText>
                    </View>
                    <View style={styles.featureItem}>
                      <Feather name="bar-chart-2" size={16} color={Colors.primary} />
                      <ThemedText type="caption">Analytics</ThemedText>
                    </View>
                    <View style={styles.featureItem}>
                      <Feather name="code" size={16} color={Colors.primary} />
                      <ThemedText type="caption">Barcodes</ThemedText>
                    </View>
                    <View style={styles.featureItem}>
                      <Feather name="file-text" size={16} color={Colors.primary} />
                      <ThemedText type="caption">Flyers</ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </Card>

            <Spacer size="lg" />

            <Pressable
              style={[styles.cancelButton, { borderColor: Colors.error }]}
              onPress={handleCancel}
            >
              <ThemedText type="body" style={{ color: Colors.error }}>
                Cancel Subscription
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={[styles.proIcon, { backgroundColor: Colors.primary + "20" }]}>
                <Feather name="star" size={32} color={Colors.primary} />
              </View>
              <Spacer size="md" />
              <ThemedText type="h2">Upgrade to Pro</ThemedText>
              <Spacer size="sm" />
              <ThemedText type="body" secondary style={{ textAlign: "center" }}>
                Unlock powerful tools to grow your business
              </ThemedText>
            </View>

            <Spacer size="xl" />

            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <Card
                  key={plan.id}
                  onPress={() => handleSelectPlan(plan.id)}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    { borderColor: isSelected ? Colors.primary : theme.border, borderWidth: isSelected ? 2 : 1 },
                  ]}
                >
                  {plan.savings && (
                    <View style={[styles.savingsBadge, { backgroundColor: Colors.success }]}>
                      <ThemedText type="caption" style={{ color: "#fff", fontWeight: "700" }}>
                        SAVE {plan.savings}%
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    {/* Radio Button Indicator */}
                    <View style={[
                      styles.radioButton,
                      { borderColor: isSelected ? Colors.primary : theme.textSecondary }
                    ]}>
                      {isSelected && (
                        <View style={[styles.radioButtonInner, { backgroundColor: Colors.primary }]} />
                      )}
                    </View>
                    <View style={styles.planInfo}>
                      <ThemedText type="h4">{plan.name}</ThemedText>
                      <ThemedText type="small" secondary>
                        {plan.description}
                      </ThemedText>
                    </View>
                    <View style={styles.priceContainer}>
                      <ThemedText type="h2" style={{ color: isSelected ? Colors.primary : theme.text }}>
                        {formatPrice(plan.price)}
                      </ThemedText>
                      {plan.interval && (
                        <ThemedText type="caption" secondary>
                          /{plan.interval}
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  <Spacer size="md" />

                  <View style={styles.features}>
                    {plan.features?.map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <Feather name="check" size={16} color={Colors.success} />
                        <ThemedText type="small" style={styles.featureText}>
                          {feature}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: Colors.primary }]}>
                      <Feather name="check" size={14} color="#fff" />
                      <ThemedText type="caption" style={{ color: "#fff", marginLeft: 4 }}>
                        Selected
                      </ThemedText>
                    </View>
                  )}
                </Card>
              );
            })}

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
                <>
                  <Feather
                    name="credit-card"
                    size={20}
                    color={selectedPlan ? "#fff" : theme.textSecondary}
                    style={{ marginRight: Spacing.sm }}
                  />
                  <ThemedText
                    type="body"
                    style={{
                      color: selectedPlan ? "#fff" : theme.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    {selectedPlan ? "Subscribe Now" : "Select a Plan"}
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Spacer size="lg" />

            <View style={styles.securityInfo}>
              <Feather name="lock" size={16} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={{ marginLeft: Spacing.xs }}>
                Secure payment powered by Stripe
              </ThemedText>
            </View>

            <Spacer size="md" />

            <ThemedText type="caption" secondary style={styles.disclaimer}>
              Cancel anytime. No hidden fees. All payments are securely processed.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
  },
  proIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  planCard: {
    marginBottom: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    backgroundColor: Colors.primary + "08",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  planInfo: {
    flex: 1,
    marginRight: Spacing.md,
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
  savingsBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomRightRadius: BorderRadius.md,
  },
  purchaseButton: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  proFeatures: {
    marginTop: Spacing.xl,
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    width: "45%",
  },
});
