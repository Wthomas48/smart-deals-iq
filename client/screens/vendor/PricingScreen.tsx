import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
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

const BILLING_BASE_URL = "https://smartdealsiq.com/vendor/billing";

const PLAN_FEATURES = [
  {
    id: "free",
    name: "Free Tier",
    description: "Basic listing on map",
    features: [
      "Business listing on map",
      "1 location update per hour",
      "Standard map pin",
      "Basic profile",
    ],
  },
  {
    id: "starter",
    name: "7-Day Featured Ad",
    description: "One-time featured listing",
    features: [
      "7 days featured listing",
      "3 active promotions",
      "Unlimited location updates",
      "Featured map pin",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "Full-featured for growing businesses",
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
];

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
  } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);

  const billingUrl = `${BILLING_BASE_URL}?vendorId=${encodeURIComponent(user?.id || "")}&email=${encodeURIComponent(user?.email || "")}`;

  const handleManageBilling = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(billingUrl);
  };

  const handleRefreshStatus = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      // Re-check subscription status from server
      await subscribe("refresh", user?.email);
      triggerNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Status Updated", "Your subscription status has been refreshed.");
    } catch {
      Alert.alert("Error", "Could not refresh status. Please try again.");
    }
    setRefreshing(false);
  };

  const handleActivateFree = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const success = await subscribe("prod_free", user?.email);
    if (success) {
      triggerNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Free tier activated! You can now list your business on the map.");
    }
  };

  const handleCancelOnWeb = () => {
    Alert.alert(
      "Manage Subscription",
      "To cancel or change your subscription, visit your billing page on our website.",
      [
        { text: "Not Now", style: "cancel" },
        { text: "Open Billing Page", onPress: () => Linking.openURL(billingUrl) },
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
        {isSubscribed && subscription?.planId !== "prod_free" ? (
          <>
            <Card style={styles.activeSubscription}>
              <View style={styles.subscriptionHeader}>
                <View style={[styles.activeIcon, { backgroundColor: Colors.success + "20" }]}>
                  <Feather name="check-circle" size={24} color={Colors.success} />
                </View>
                <View style={styles.subscriptionInfo}>
                  <ThemedText type="h4">Active Subscription</ThemedText>
                  <ThemedText type="body" secondary>
                    {isPro ? "Pro Plan" : "Featured Ad"}
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
              style={[styles.manageButton, { backgroundColor: Colors.primary }]}
              onPress={handleManageBilling}
            >
              <Feather name="external-link" size={20} color="#fff" style={{ marginRight: Spacing.sm }} />
              <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                Manage Billing on Website
              </ThemedText>
            </Pressable>

            <Spacer size="md" />

            <Pressable
              style={[styles.refreshButton, { borderColor: Colors.primary }]}
              onPress={handleRefreshStatus}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="body" style={{ color: Colors.primary }}>
                    Refresh Status
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Spacer size="lg" />

            <Pressable
              style={[styles.cancelButton, { borderColor: Colors.error }]}
              onPress={handleCancelOnWeb}
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
              <ThemedText type="h2">Grow Your Business</ThemedText>
              <Spacer size="sm" />
              <ThemedText type="body" secondary style={{ textAlign: "center" }}>
                Unlock powerful tools to reach more customers
              </ThemedText>
            </View>

            <Spacer size="xl" />

            {/* Free Tier */}
            <Card style={[styles.planCard, { borderColor: theme.border, borderWidth: 1 }]}>
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <ThemedText type="h4">{PLAN_FEATURES[0].name}</ThemedText>
                  <ThemedText type="small" secondary>{PLAN_FEATURES[0].description}</ThemedText>
                </View>
                <View style={[styles.freeBadge, { backgroundColor: Colors.success + "20" }]}>
                  <ThemedText type="small" style={{ color: Colors.success, fontWeight: "700" }}>FREE</ThemedText>
                </View>
              </View>
              <Spacer size="md" />
              <View style={styles.features}>
                {PLAN_FEATURES[0].features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color={Colors.success} />
                    <ThemedText type="small" style={styles.featureText}>{feature}</ThemedText>
                  </View>
                ))}
              </View>
              <Spacer size="md" />
              <Pressable
                style={[styles.activateButton, { backgroundColor: Colors.success }]}
                onPress={handleActivateFree}
              >
                <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                  Activate Free Tier
                </ThemedText>
              </Pressable>
            </Card>

            {/* Paid Plans - No prices shown */}
            {PLAN_FEATURES.slice(1).map((plan) => (
              <Card key={plan.id} style={[styles.planCard, { borderColor: theme.border, borderWidth: 1 }]}>
                {plan.id === "pro" && (
                  <View style={[styles.popularBadge, { backgroundColor: Colors.primary }]}>
                    <ThemedText type="caption" style={{ color: "#fff", fontWeight: "700" }}>
                      MOST POPULAR
                    </ThemedText>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <ThemedText type="h4">{plan.name}</ThemedText>
                    <ThemedText type="small" secondary>{plan.description}</ThemedText>
                  </View>
                </View>
                <Spacer size="md" />
                <View style={styles.features}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Feather name="check" size={16} color={Colors.success} />
                      <ThemedText type="small" style={styles.featureText}>{feature}</ThemedText>
                    </View>
                  ))}
                </View>
              </Card>
            ))}

            <Spacer size="xl" />

            {/* Subscribe on Website button */}
            <Pressable
              style={[styles.purchaseButton, { backgroundColor: Colors.primary }]}
              onPress={handleManageBilling}
            >
              <Feather name="external-link" size={20} color="#fff" style={{ marginRight: Spacing.sm }} />
              <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                Subscribe on Website
              </ThemedText>
            </Pressable>

            <Spacer size="md" />

            {/* Refresh Status button */}
            <Pressable
              style={[styles.refreshButton, { borderColor: Colors.primary }]}
              onPress={handleRefreshStatus}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="body" style={{ color: Colors.primary }}>
                    Already Subscribed? Refresh Status
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Spacer size="lg" />

            <View style={styles.securityInfo}>
              <Feather name="lock" size={16} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={{ marginLeft: Spacing.xs }}>
                Secure payment on smartdealsiq.com
              </ThemedText>
            </View>

            <Spacer size="md" />

            <ThemedText type="caption" secondary style={styles.disclaimer}>
              Subscribe on our website. After payment, return here and tap "Refresh Status" to unlock features.
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
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  planInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  freeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
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
  activateButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  purchaseButton: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  manageButton: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
