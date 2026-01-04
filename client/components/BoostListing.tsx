import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { Card } from "./Card";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import {
  foodTruckService,
  BOOST_PRICING,
  FeaturedListing,
} from "@/lib/food-truck-service";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";

type BoostLevel = "basic" | "premium" | "spotlight";

interface BoostOption {
  id: BoostLevel;
  name: string;
  price: number;
  duration: number;
  description: string;
  features: string[];
  gradient: readonly [string, string];
  icon: keyof typeof Feather.glyphMap;
  popular?: boolean;
}

const BOOST_OPTIONS: BoostOption[] = [
  {
    id: "basic",
    name: "Basic Boost",
    price: 4.99,
    duration: 24,
    description: "24 hours of increased visibility",
    features: ["Priority in search", "Boost badge"],
    gradient: ["#6366F1", "#818CF8"] as const,
    icon: "trending-up",
  },
  {
    id: "premium",
    name: "Premium Boost",
    price: 14.99,
    duration: 72,
    description: "3 days of maximum exposure",
    features: ["Top of search", "Featured badge", "Push notifications", "Analytics"],
    gradient: ["#F59E0B", "#FBBF24"] as const,
    icon: "zap",
    popular: true,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    price: 29.99,
    duration: 168,
    description: "Be the featured truck of the week",
    features: ["Homepage feature", "Spotlight banner", "Social shoutout", "Premium analytics"],
    gradient: ["#EC4899", "#F472B6"] as const,
    icon: "star",
  },
];

export function BoostListing() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { formatPrice } = useSubscription();
  const [selectedBoost, setSelectedBoost] = useState<BoostLevel | null>(null);
  const [activeBoost, setActiveBoost] = useState<FeaturedListing | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const boost = foodTruckService.getActiveBoost(user.id);
      setActiveBoost(boost);
    }
  }, [user?.id]);

  const handlePurchase = async () => {
    if (!selectedBoost || !user?.id) return;

    const option = BOOST_OPTIONS.find((o) => o.id === selectedBoost);
    if (!option) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Confirm Boost Purchase",
      `Purchase ${option.name} for ${formatPrice(option.price)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          onPress: async () => {
            setLoading(true);
            try {
              const listing = await foodTruckService.purchaseBoost(user.id, selectedBoost);
              if (listing) {
                setActiveBoost(listing);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success!", `Your ${option.name} is now active!`);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to purchase boost. Please try again.");
            } finally {
              setLoading(false);
              setSelectedBoost(null);
            }
          },
        },
      ]
    );
  };

  const getTimeRemaining = (endDate: string): string => {
    const ms = new Date(endDate).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  };

  // If there's an active boost, show the status
  if (activeBoost) {
    const boostInfo = BOOST_OPTIONS.find((o) => o.id === activeBoost.boostLevel);

    return (
      <Card style={styles.activeBoostCard}>
        <LinearGradient
          colors={boostInfo?.gradient || (["#6366F1", "#818CF8"] as const)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeBoostGradient}
        >
          <View style={styles.activeBoostHeader}>
            <Feather name={boostInfo?.icon || "zap"} size={24} color="#fff" />
            <View style={styles.activeBoostInfo}>
              <ThemedText type="h4" style={{ color: "#fff" }}>
                {boostInfo?.name} Active
              </ThemedText>
              <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
                {getTimeRemaining(activeBoost.endDate)}
              </ThemedText>
            </View>
          </View>

          <Spacer size="lg" />

          <View style={styles.boostStats}>
            <View style={styles.boostStatItem}>
              <ThemedText type="h3" style={{ color: "#fff" }}>
                {activeBoost.impressions}
              </ThemedText>
              <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                Impressions
              </ThemedText>
            </View>
            <View style={styles.boostStatDivider} />
            <View style={styles.boostStatItem}>
              <ThemedText type="h3" style={{ color: "#fff" }}>
                {activeBoost.clicks}
              </ThemedText>
              <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                Clicks
              </ThemedText>
            </View>
            <View style={styles.boostStatDivider} />
            <View style={styles.boostStatItem}>
              <ThemedText type="h3" style={{ color: "#fff" }}>
                {activeBoost.impressions > 0
                  ? ((activeBoost.clicks / activeBoost.impressions) * 100).toFixed(1)
                  : 0}%
              </ThemedText>
              <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                CTR
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="trending-up" size={24} color={Colors.primary} />
        <Spacer size="sm" />
        <ThemedText type="h4">Boost Your Listing</ThemedText>
      </View>
      <ThemedText type="small" secondary>
        Get more visibility and attract more customers
      </ThemedText>

      <Spacer size="xl" />

      {BOOST_OPTIONS.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => setSelectedBoost(option.id)}
        >
          <Card
            style={{
              ...styles.optionCard,
              ...(selectedBoost === option.id && {
                borderColor: Colors.primary,
                borderWidth: 2,
              }),
            }}
          >
            {option.popular && (
              <View style={[styles.popularBadge, { backgroundColor: Colors.warning }]}>
                <ThemedText type="caption" style={{ color: "#fff", fontWeight: "700" }}>
                  POPULAR
                </ThemedText>
              </View>
            )}

            <View style={styles.optionHeader}>
              <LinearGradient
                colors={option.gradient}
                style={styles.optionIcon}
              >
                <Feather name={option.icon} size={20} color="#fff" />
              </LinearGradient>
              <View style={styles.optionInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {option.name}
                </ThemedText>
                <ThemedText type="caption" secondary>
                  {option.description}
                </ThemedText>
              </View>
              <View style={styles.optionPrice}>
                <ThemedText type="h4" style={{ color: Colors.primary }}>
                  {formatPrice(option.price)}
                </ThemedText>
                <ThemedText type="caption" secondary>
                  {option.duration}h
                </ThemedText>
              </View>
            </View>

            <Spacer size="md" />

            <View style={styles.features}>
              {option.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Feather name="check" size={14} color={Colors.success} />
                  <ThemedText type="caption" style={{ marginLeft: Spacing.xs }}>
                    {feature}
                  </ThemedText>
                </View>
              ))}
            </View>

            {selectedBoost === option.id && (
              <View style={[styles.selectedIndicator, { backgroundColor: Colors.primary }]}>
                <Feather name="check" size={14} color="#fff" />
              </View>
            )}
          </Card>
        </Pressable>
      ))}

      <Spacer size="xl" />

      <Pressable
        style={[
          styles.purchaseButton,
          { backgroundColor: selectedBoost ? Colors.primary : theme.backgroundTertiary },
        ]}
        onPress={handlePurchase}
        disabled={!selectedBoost || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather
              name="credit-card"
              size={20}
              color={selectedBoost ? "#fff" : theme.textSecondary}
            />
            <ThemedText
              type="body"
              style={{
                marginLeft: Spacing.sm,
                color: selectedBoost ? "#fff" : theme.textSecondary,
                fontWeight: "600",
              }}
            >
              {selectedBoost ? "Purchase Boost" : "Select a Boost"}
            </ThemedText>
          </>
        )}
      </Pressable>

      <Spacer size="md" />

      <View style={styles.securityNote}>
        <Feather name="lock" size={14} color={theme.textSecondary} />
        <ThemedText type="caption" secondary style={{ marginLeft: Spacing.xs }}>
          Secure payment via Stripe
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionCard: {
    marginBottom: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  optionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  optionPrice: {
    alignItems: "flex-end",
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedIndicator: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBoostCard: {
    padding: 0,
    overflow: "hidden",
  },
  activeBoostGradient: {
    padding: Spacing.xl,
  },
  activeBoostHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeBoostInfo: {
    marginLeft: Spacing.md,
  },
  boostStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  boostStatItem: {
    alignItems: "center",
  },
  boostStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
