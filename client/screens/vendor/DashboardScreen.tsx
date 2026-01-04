import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Pressable, Platform, Modal, TextInput, Alert } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useVendorListing } from "@/lib/vendor-listing-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { socialShareService } from "@/lib/social-share-service";
import { useNavigation } from "@react-navigation/native";
import { useSubscription } from "@/lib/subscription-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width } = Dimensions.get("window");

// Animated KPI Card component
function KPICard({ kpi, index }: { kpi: any; index: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 100, withSpring(1, { damping: 12 }));
    opacity.value = withDelay(index * 100, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.95);
    setTimeout(() => {
      scale.value = withSpring(1);
    }, 100);
  };

  return (
    <AnimatedPressable onPress={handlePress} style={animStyle}>
      <Card style={{ ...styles.kpiCard, backgroundColor: kpi.color + '10' }}>
        <View style={styles.kpiGradient}>
          <View style={[styles.kpiIcon, { backgroundColor: kpi.color + "25" }]}>
            <Feather name={kpi.icon as any} size={20} color={kpi.color} />
          </View>
          <ThemedText type="h3" style={styles.kpiValue}>{kpi.value}</ThemedText>
          <ThemedText type="caption" secondary>{kpi.label}</ThemedText>
          {kpi.change && (
            <View style={[styles.changeBadge, { backgroundColor: kpi.changePositive ? Colors.success + '20' : Colors.error + '20' }]}>
              <Feather
                name={kpi.changePositive ? "trending-up" : "trending-down"}
                size={10}
                color={kpi.changePositive ? Colors.success : Colors.error}
              />
              <ThemedText type="caption" style={{ color: kpi.changePositive ? Colors.success : Colors.error, marginLeft: 2 }}>
                {kpi.change}
              </ThemedText>
            </View>
          )}
        </View>
      </Card>
    </AnimatedPressable>
  );
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { analytics, promotions, createFlashDeal } = useData();
  const { user } = useAuth();
  const { hasListing, myListing, tierLimits } = useVendorListing();
  const { isSubscribed, isPro } = useSubscription();

  // Check if vendor has paid subscription (not just free tier)
  const hasPaidSubscription = isSubscribed && isPro;

  // Lunch Deal Modal State
  const [showLunchDealModal, setShowLunchDealModal] = useState(false);
  const [lunchDealTitle, setLunchDealTitle] = useState("Lunch Special");
  const [lunchDealDiscount, setLunchDealDiscount] = useState("20");
  const [lunchDealPrice, setLunchDealPrice] = useState("15.99");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLunchDeal = async () => {
    if (!user?.id || !user?.name) {
      Alert.alert("Error", "Please sign in to create a deal");
      return;
    }

    setIsCreating(true);
    try {
      const originalPrice = parseFloat(lunchDealPrice) || 15.99;
      const discountPercent = parseInt(lunchDealDiscount) || 20;
      const discountedPrice = originalPrice * (1 - discountPercent / 100);

      // Create a 2-hour flash deal for lunch (11am-1pm window)
      await createFlashDeal({
        vendorId: user.id,
        vendorName: user.name,
        title: lunchDealTitle || "Lunch Special",
        description: `Limited time lunch deal! ${discountPercent}% off from 11am-1pm.`,
        originalPrice,
        discountedPrice,
        discountPercent,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        category: "All",
        maxRedemptions: 50,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Lunch Deal Created!",
        "Your flash deal is now live and customers will be notified.",
        [{ text: "Great!", onPress: () => setShowLunchDealModal(false) }]
      );

      // Reset form
      setLunchDealTitle("Lunch Special");
      setLunchDealDiscount("20");
      setLunchDealPrice("15.99");
    } catch (error) {
      Alert.alert("Error", "Failed to create lunch deal. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Quick Share Handlers
  const handleShareLive = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const success = await socialShareService.shareWeAreLive(
      user?.name || "Our Food Truck",
      "Downtown Miami" // This would come from location context
    );
    if (success) {
      Alert.alert("Shared!", "Your 'We're Live!' post has been shared.");
    }
  };

  const handleShareSpecial = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Get the first active promotion as the special
    const activePromo = promotions.find(p => p.isActive);
    if (activePromo) {
      // Calculate discount percent from original and discounted prices
      const discountPercent = Math.round(
        ((activePromo.originalPrice - activePromo.discountedPrice) / activePromo.originalPrice) * 100
      );
      const success = await socialShareService.shareDailySpecial(
        user?.name || "Our Food Truck",
        activePromo.title,
        discountPercent,
        "Downtown Miami"
      );
      if (success) {
        Alert.alert("Shared!", "Your daily special has been shared.");
      }
    } else {
      Alert.alert("No Active Deal", "Create a deal first to share it!");
    }
  };

  const handleShareLocation = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const success = await socialShareService.shareNewLocation(
      user?.name || "Our Food Truck",
      "Downtown Miami, near Main St & 1st Ave"
    );
    if (success) {
      Alert.alert("Shared!", "Your new location has been shared.");
    }
  };

  const kpis = [
    { label: "Impressions", value: analytics.impressions.toLocaleString(), icon: "eye", color: Colors.secondary, change: "+12%", changePositive: true },
    { label: "Clicks", value: analytics.clicks.toLocaleString(), icon: "mouse-pointer", color: Colors.primary, change: "+8%", changePositive: true },
    { label: "Redemptions", value: analytics.redemptions.toLocaleString(), icon: "check-circle", color: Colors.success, change: "+23%", changePositive: true },
    { label: "Revenue", value: `$${analytics.revenue.toFixed(0)}`, icon: "dollar-sign", color: Colors.accent, change: "+15%", changePositive: true },
  ];

  const maxTrend = Math.max(...analytics.trend);
  const chartHeight = 120;

  const activePromotions = promotions.filter((p) => p.isActive).length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        {/* Free Tier Listing Banner */}
        <Pressable
          style={[styles.freeTierBanner, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}
          onPress={() => navigation.navigate("MyListingTab")}
        >
          <View style={styles.freeTierContent}>
            <View style={[styles.freeTierBadge, { backgroundColor: Colors.primary }]}>
              <ThemedText type="caption" style={{ color: '#fff', fontWeight: '700' }}>FREE</ThemedText>
            </View>
            <View style={styles.freeTierInfo}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {hasListing ? "Listed & Discovery Tier" : "Get Listed on the Map"}
              </ThemedText>
              <ThemedText type="caption" secondary>
                {hasListing
                  ? `${myListing?.businessName} is visible to customers`
                  : "Create your free listing to appear on the map"}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.primary} />
          </View>
          {hasListing && tierLimits && (
            <View style={styles.freeTierLimits}>
              <View style={styles.limitTag}>
                <Feather name="map-pin" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" secondary style={{ marginLeft: 4 }}>Static location</ThemedText>
              </View>
              <View style={styles.limitTag}>
                <Feather name="clock" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" secondary style={{ marginLeft: 4 }}>1 update/hour</ThemedText>
              </View>
            </View>
          )}
        </Pressable>

        <Spacer size="xl" />

        {/* KPI Cards with animations */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <KPICard key={kpi.label} kpi={kpi} index={index} />
          ))}
        </View>

        <Spacer size="xl" />

        {/* Performance Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <ThemedText type="h4">Performance Trend</ThemedText>
              <ThemedText type="caption" secondary>Click-through rate over time</ThemedText>
            </View>
            <View style={[styles.periodBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="calendar" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 4 }}>Last 7 days</ThemedText>
            </View>
          </View>
          <Spacer size="lg" />
          <View style={styles.chart}>
            {analytics.trend.map((value, index) => (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (value / maxTrend) * chartHeight,
                      backgroundColor: index === analytics.trend.length - 1 ? Colors.primary : Colors.primary + "60",
                    },
                  ]}
                />
                <ThemedText type="caption" secondary style={styles.barLabel}>
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>

        <Spacer size="xl" />

        {/* Benchmark Card */}
        <Card style={{ ...styles.benchmarkCard, backgroundColor: Colors.success + '10' }}>
          <View style={styles.benchmarkRow}>
            <View style={styles.benchmarkIcon}>
              <Feather name="trending-up" size={24} color={Colors.success} />
            </View>
            <View style={styles.benchmarkContent}>
              <ThemedText type="body" style={{ fontWeight: "700" }}>
                Outperforming 68% of vendors
              </ThemedText>
              <ThemedText type="small" secondary>
                Based on click-through rate in your area
              </ThemedText>
            </View>
            <View style={[styles.rankBadge, { backgroundColor: Colors.success }]}>
              <ThemedText type="caption" style={{ color: '#fff', fontWeight: '700' }}>#1</ThemedText>
            </View>
          </View>
        </Card>

        <Spacer size="xl" />

        {/* Quick Stats */}
        <ThemedText type="h4">Quick Stats</ThemedText>
        <Spacer size="md" />
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Feather name="tag" size={20} color={Colors.primary} />
            </View>
            <ThemedText type="h3" style={styles.statValue}>{activePromotions}</ThemedText>
            <ThemedText type="caption" secondary>Active Deals</ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Feather name="users" size={20} color={Colors.secondary} />
            </View>
            <ThemedText type="h3" style={styles.statValue}>156</ThemedText>
            <ThemedText type="caption" secondary>Followers</ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Feather name="repeat" size={20} color={Colors.accent} />
            </View>
            <ThemedText type="h3" style={styles.statValue}>42%</ThemedText>
            <ThemedText type="caption" secondary>Return Rate</ThemedText>
          </Card>
        </View>

        <Spacer size="xl" />

        {/* Quick Share Section */}
        <ThemedText type="h4">Quick Share</ThemedText>
        <ThemedText type="caption" secondary>One-tap social sharing</ThemedText>
        <Spacer size="md" />
        <View style={styles.quickShareRow}>
          <Pressable
            style={[styles.quickShareButton, { backgroundColor: Colors.success + '15', borderColor: Colors.success }]}
            onPress={handleShareLive}
          >
            <View style={[styles.quickShareIcon, { backgroundColor: Colors.success + '25' }]}>
              <Feather name="radio" size={20} color={Colors.success} />
            </View>
            <ThemedText type="small" style={{ fontWeight: '600', color: Colors.success }}>
              We're Live!
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickShareButton, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary }]}
            onPress={handleShareSpecial}
          >
            <View style={[styles.quickShareIcon, { backgroundColor: Colors.primary + '25' }]}>
              <Feather name="tag" size={20} color={Colors.primary} />
            </View>
            <ThemedText type="small" style={{ fontWeight: '600', color: Colors.primary }}>
              Daily Special
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickShareButton, { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary }]}
            onPress={handleShareLocation}
          >
            <View style={[styles.quickShareIcon, { backgroundColor: Colors.secondary + '25' }]}>
              <Feather name="map-pin" size={20} color={Colors.secondary} />
            </View>
            <ThemedText type="small" style={{ fontWeight: '600', color: Colors.secondary }}>
              New Location
            </ThemedText>
          </Pressable>
        </View>

        <Spacer size="xl" />

        {/* AI Tip Card */}
        <Card style={{ ...styles.tipCard, backgroundColor: Colors.accent + '10' }}>
          <View style={[styles.tipBadge, { backgroundColor: Colors.accent + "25" }]}>
            <Feather name="zap" size={14} color={Colors.accent} />
            <ThemedText type="caption" style={{ color: Colors.accent, marginLeft: 4, fontWeight: '600' }}>AI Insight</ThemedText>
          </View>
          <Spacer size="md" />
          <ThemedText type="body" style={{ fontWeight: "700" }}>
            Lunch hour is your busiest time
          </ThemedText>
          <ThemedText type="small" secondary style={{ marginTop: 4 }}>
            Consider running flash deals between 11am-1pm. Vendors who do this see 34% more redemptions.
          </ThemedText>
          <Spacer size="md" />
          <Pressable
            style={[styles.tipButton, { backgroundColor: Colors.accent }]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (!hasPaidSubscription) {
                Alert.alert(
                  "Upgrade Required",
                  "Subscribe to a paid plan to create lunch deals and flash promotions. Try our 7-Day Ad for just $7.99!",
                  [
                    { text: "Maybe Later", style: "cancel" },
                    {
                      text: "View Plans",
                      onPress: () => navigation.navigate("PricingTab")
                    },
                  ]
                );
                return;
              }
              setShowLunchDealModal(true);
            }}
          >
            <ThemedText type="small" style={{ color: '#000', fontWeight: '600' }}>
              {hasPaidSubscription ? "Create Lunch Deal" : "Upgrade to Create"}
            </ThemedText>
            <Feather name={hasPaidSubscription ? "arrow-right" : "lock"} size={16} color="#000" />
          </Pressable>
        </Card>
      </ScrollView>

      {/* Lunch Deal Modal */}
      <Modal visible={showLunchDealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Create Lunch Deal</ThemedText>
              <Pressable onPress={() => setShowLunchDealModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <Spacer size="lg" />

            <View style={[styles.aiSuggestion, { backgroundColor: Colors.accent + "15" }]}>
              <Feather name="zap" size={18} color={Colors.accent} />
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <ThemedText type="small" style={{ fontWeight: "600", color: Colors.accent }}>
                  AI Recommendation
                </ThemedText>
                <ThemedText type="caption" secondary>
                  Based on your data, 20% off deals perform best during lunch hours (11am-1pm)
                </ThemedText>
              </View>
            </View>

            <Spacer size="lg" />

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: "600" }}>Deal Title</ThemedText>
              <Spacer size="xs" />
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                placeholder="e.g., Lunch Special"
                placeholderTextColor={theme.textSecondary}
                value={lunchDealTitle}
                onChangeText={setLunchDealTitle}
              />
            </View>

            <Spacer size="md" />

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText type="small" style={{ fontWeight: "600" }}>Original Price ($)</ThemedText>
                <Spacer size="xs" />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                  placeholder="15.99"
                  placeholderTextColor={theme.textSecondary}
                  value={lunchDealPrice}
                  onChangeText={setLunchDealPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText type="small" style={{ fontWeight: "600" }}>Discount (%)</ThemedText>
                <Spacer size="xs" />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                  placeholder="20"
                  placeholderTextColor={theme.textSecondary}
                  value={lunchDealDiscount}
                  onChangeText={setLunchDealDiscount}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Spacer size="lg" />

            <View style={[styles.dealPreview, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="caption" secondary>Deal Preview</ThemedText>
              <View style={styles.previewPrices}>
                <ThemedText type="body" style={{ textDecorationLine: "line-through", color: theme.textSecondary }}>
                  ${parseFloat(lunchDealPrice || "0").toFixed(2)}
                </ThemedText>
                <Feather name="arrow-right" size={16} color={theme.textSecondary} style={{ marginHorizontal: Spacing.sm }} />
                <ThemedText type="h3" style={{ color: Colors.success }}>
                  ${(parseFloat(lunchDealPrice || "0") * (1 - parseInt(lunchDealDiscount || "0") / 100)).toFixed(2)}
                </ThemedText>
              </View>
              <ThemedText type="caption" style={{ color: Colors.success }}>
                Customers save {lunchDealDiscount || 0}%
              </ThemedText>
            </View>

            <Spacer size="lg" />

            <View style={styles.durationInfo}>
              <Feather name="clock" size={16} color={Colors.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                This flash deal will be active for 2 hours
              </ThemedText>
            </View>

            <Spacer size="xl" />

            <Pressable
              style={[styles.createButton, { backgroundColor: Colors.accent, opacity: isCreating ? 0.7 : 1 }]}
              onPress={handleCreateLunchDeal}
              disabled={isCreating}
            >
              <Feather name="zap" size={18} color="#000" />
              <ThemedText type="body" style={{ color: "#000", fontWeight: "600", marginLeft: Spacing.sm }}>
                {isCreating ? "Creating..." : "Launch Lunch Deal"}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  kpiCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    padding: 0,
    overflow: 'hidden',
  },
  kpiGradient: {
    padding: Spacing.md,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    marginBottom: Spacing.xs,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  chartCard: {},
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    width: 28,
    borderRadius: BorderRadius.xs,
  },
  barLabel: {
    marginTop: Spacing.sm,
  },
  benchmarkCard: {},
  benchmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benchmarkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  benchmarkContent: {
    flex: 1,
  },
  rankBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginVertical: Spacing.xs,
  },
  tipCard: {},
  tipBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiSuggestion: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  inputGroup: {},
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: "row",
  },
  dealPreview: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  previewPrices: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  durationInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  // Quick Share Styles
  quickShareRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickShareButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  quickShareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  // Free Tier Banner Styles
  freeTierBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  freeTierContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  freeTierBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  freeTierInfo: {
    flex: 1,
  },
  freeTierLimits: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  limitTag: {
    flexDirection: "row",
    alignItems: "center",
  },
});
