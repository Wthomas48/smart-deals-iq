import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, Modal, Switch, ActivityIndicator, Alert, Platform, ScrollView, Animated } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { VoiceInput } from "@/components/VoiceInput";
import { DealTemplates } from "@/components/DealTemplates";
import { useTheme } from "@/hooks/useTheme";
import { useData, Promotion, FOOD_CATEGORIES, FoodCategory, FlashDeal } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// Flash deal duration options
const FLASH_DURATIONS = [
  { label: "15 min", value: 15, color: "#EF4444" },
  { label: "30 min", value: 30, color: "#F97316" },
  { label: "1 hour", value: 60, color: "#F59E0B" },
  { label: "2 hours", value: 120, color: "#10B981" },
  { label: "4 hours", value: 240, color: "#3B82F6" },
];

const AI_SUGGESTIONS = [
  "Taco Tuesday: Buy 2, Get 1 Free until 2pm!",
  "Happy Hour Special: 20% off all items 3-5pm",
  "Weekend Warrior: Family combo deal $29.99",
  "Flash Sale: First 50 customers get 50% off!",
  "Lunch Rush: Free drink with any entree 11am-1pm",
];

export default function PromotionsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { promotions, addPromotion, updatePromotion, deletePromotion, flashDeals, createFlashDeal, deleteFlashDeal, getActiveFlashDeals } = useData();
  const { user } = useAuth();
  const { isSubscribed, isPro, daysRemaining, plans, formatPrice } = useSubscription();
  const navigation = useNavigation<any>();

  // Check if vendor has paid subscription (not just free tier)
  const hasPaidSubscription = isSubscribed && isPro;

  // Tab state: "regular" or "flash"
  const [activeTab, setActiveTab] = useState<"regular" | "flash">("regular");

  // Regular promo state
  const [showModal, setShowModal] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>("All");

  // Flash deal state
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [flashTitle, setFlashTitle] = useState("");
  const [flashDescription, setFlashDescription] = useState("");
  const [flashOriginalPrice, setFlashOriginalPrice] = useState("");
  const [flashDiscountPercent, setFlashDiscountPercent] = useState("50");
  const [flashDuration, setFlashDuration] = useState(30); // minutes
  const [flashMaxRedemptions, setFlashMaxRedemptions] = useState("");
  const [flashCategory, setFlashCategory] = useState<FoodCategory>("All");
  const [isCreatingFlash, setIsCreatingFlash] = useState(false);

  // Countdown timer for flash deals
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get vendor's flash deals
  const vendorFlashDeals = useMemo(() => {
    // In a real app, filter by vendor ID
    return flashDeals;
  }, [flashDeals]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOriginalPrice("");
    setDiscountedPrice("");
    setIsActive(true);
    setSelectedCategory("All");
  };

  const resetFlashForm = () => {
    setFlashTitle("");
    setFlashDescription("");
    setFlashOriginalPrice("");
    setFlashDiscountPercent("50");
    setFlashDuration(30);
    setFlashMaxRedemptions("");
    setFlashCategory("All");
  };

  const handleCreateFlashDeal = async () => {
    if (!flashTitle || !flashDescription || !flashOriginalPrice) return;

    setIsCreatingFlash(true);
    try {
      const originalPriceNum = parseFloat(flashOriginalPrice);
      const discountPercentNum = parseInt(flashDiscountPercent, 10);
      const discountedPriceNum = originalPriceNum * (1 - discountPercentNum / 100);

      await createFlashDeal({
        vendorId: user?.id || "vendor1",
        vendorName: user?.name || "Your Restaurant",
        title: flashTitle,
        description: flashDescription,
        originalPrice: originalPriceNum,
        discountedPrice: parseFloat(discountedPriceNum.toFixed(2)),
        discountPercent: discountPercentNum,
        expiresAt: new Date(Date.now() + flashDuration * 60 * 1000).toISOString(),
        category: flashCategory !== "All" ? flashCategory : undefined,
        maxRedemptions: flashMaxRedemptions ? parseInt(flashMaxRedemptions, 10) : undefined,
      });

      resetFlashForm();
      setShowFlashModal(false);
      Alert.alert("Flash Deal Created!", "Your flash deal is now live and customers have been notified!");
    } catch (error) {
      console.error("Error creating flash deal:", error);
      Alert.alert("Error", "Failed to create flash deal. Please try again.");
    } finally {
      setIsCreatingFlash(false);
    }
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getTimeRemainingColor = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = diff / (1000 * 60);

    if (minutes <= 5) return Colors.error;
    if (minutes <= 15) return "#F97316";
    if (minutes <= 30) return "#F59E0B";
    return Colors.success;
  };

  const handleCreate = async () => {
    if (!title || !description || !originalPrice || !discountedPrice) return;

    await addPromotion({
      title,
      description,
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      isActive,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    });

    resetForm();
    setShowModal(false);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsGenerating(false);
    setShowAISuggestions(true);
  };

  const applyAISuggestion = (suggestion: string) => {
    setTitle(suggestion.split(":")[0].trim());
    setDescription(suggestion);
    setShowAISuggestions(false);
  };

  // Handle template selection for regular promotions
  const handlePromotionTemplateSelect = (
    templateTitle: string,
    templateDescription: string,
    suggestedDiscount?: number
  ) => {
    setTitle(templateTitle);
    setDescription(templateDescription);
    // If there's a suggested discount and an original price, calculate discounted price
    if (suggestedDiscount && originalPrice) {
      const original = parseFloat(originalPrice);
      if (!isNaN(original)) {
        const discounted = original * (1 - suggestedDiscount / 100);
        setDiscountedPrice(discounted.toFixed(2));
      }
    }
  };

  // Handle template selection for flash deals
  const handleFlashTemplateSelect = (
    templateTitle: string,
    templateDescription: string,
    suggestedDiscount?: number,
    suggestedDuration?: number
  ) => {
    setFlashTitle(templateTitle);
    setFlashDescription(templateDescription);
    if (suggestedDiscount) {
      setFlashDiscountPercent(suggestedDiscount.toString());
    }
    if (suggestedDuration) {
      // Find the closest matching duration option
      const closestDuration = FLASH_DURATIONS.reduce((prev, curr) =>
        Math.abs(curr.value - suggestedDuration) < Math.abs(prev.value - suggestedDuration) ? curr : prev
      );
      setFlashDuration(closestDuration.value);
    }
  };

  const togglePromoActive = async (promo: Promotion) => {
    await updatePromotion(promo.id, { isActive: !promo.isActive });
  };

  const renderPromotion = ({ item }: { item: Promotion }) => {
    const categoryInfo = item.category ? FOOD_CATEGORIES.find(c => c.id === item.category) : null;

    return (
    <Card style={styles.promoCard}>
      <View style={styles.promoHeader}>
        <View style={styles.promoInfo}>
          <View style={styles.promoTitleRow}>
            <ThemedText type="h4" numberOfLines={1} style={{ flex: 1 }}>{item.title}</ThemedText>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: item.isActive ? Colors.success : theme.textSecondary }
            ]} />
          </View>
          <ThemedText type="small" secondary numberOfLines={2} style={styles.promoDesc}>
            {item.description}
          </ThemedText>
          {categoryInfo && (
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + "20" }]}>
              <Feather name={categoryInfo.icon as any} size={12} color={categoryInfo.color} />
              <ThemedText type="caption" style={{ color: categoryInfo.color, marginLeft: 4 }}>
                {categoryInfo.label}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceInfo}>
          <ThemedText type="caption" secondary>Original</ThemedText>
          <ThemedText type="body" style={styles.originalPrice}>
            ${item.originalPrice.toFixed(2)}
          </ThemedText>
        </View>
        <Feather name="arrow-right" size={16} color={theme.textSecondary} />
        <View style={styles.priceInfo}>
          <ThemedText type="caption" secondary>Sale</ThemedText>
          <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
            ${item.discountedPrice.toFixed(2)}
          </ThemedText>
        </View>
        <View style={[styles.savingsBadge, { backgroundColor: Colors.primary + "20" }]}>
          <ThemedText type="caption" style={{ color: Colors.primary }}>
            -{Math.round((1 - item.discountedPrice / item.originalPrice) * 100)}%
          </ThemedText>
        </View>
      </View>

      <View style={[styles.promoActions, { borderTopColor: theme.border }]}>
        <View style={styles.toggleRow}>
          <ThemedText type="small">Active</ThemedText>
          <Switch
            value={item.isActive}
            onValueChange={() => togglePromoActive(item)}
            trackColor={{ false: theme.backgroundTertiary, true: Colors.success + "60" }}
            thumbColor={item.isActive ? Colors.success : theme.backgroundSecondary}
          />
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => deletePromotion(item.id)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={Colors.error} />
        </Pressable>
      </View>
    </Card>
    );
  };

  const renderFlashDeal = ({ item }: { item: FlashDeal }) => {
    const timeRemaining = getTimeRemaining(item.expiresAt);
    const timeColor = getTimeRemainingColor(item.expiresAt);
    const isExpired = timeRemaining === "Expired";
    const redemptionPercent = item.maxRedemptions
      ? (item.currentRedemptions / item.maxRedemptions) * 100
      : 0;

    return (
      <Card style={{ ...styles.flashCard, ...(isExpired ? { opacity: 0.5 } : {}) }}>
        <View style={styles.flashHeader}>
          <View style={[styles.flashBadge, { backgroundColor: isExpired ? theme.textSecondary : Colors.error }]}>
            <Feather name="zap" size={12} color="#fff" />
            <ThemedText type="caption" style={styles.flashBadgeText}>FLASH</ThemedText>
          </View>
          <View style={[styles.timerBadge, { backgroundColor: timeColor + "20" }]}>
            <Feather name="clock" size={12} color={timeColor} />
            <ThemedText type="caption" style={{ color: timeColor, marginLeft: 4, fontWeight: "700" }}>
              {timeRemaining}
            </ThemedText>
          </View>
        </View>

        <View style={styles.flashContent}>
          <View style={styles.flashDiscountCircle}>
            <ThemedText type="h2" style={{ color: Colors.error }}>{item.discountPercent}%</ThemedText>
            <ThemedText type="caption" style={{ color: Colors.error }}>OFF</ThemedText>
          </View>
          <View style={styles.flashInfo}>
            <ThemedText type="h4" numberOfLines={1}>{item.title}</ThemedText>
            <ThemedText type="small" secondary numberOfLines={2}>{item.description}</ThemedText>
            <View style={styles.flashPriceRow}>
              <ThemedText type="body" style={styles.flashOriginalPrice}>
                ${item.originalPrice.toFixed(2)}
              </ThemedText>
              <ThemedText type="h4" style={{ color: Colors.success }}>
                ${item.discountedPrice.toFixed(2)}
              </ThemedText>
            </View>
          </View>
        </View>

        {item.maxRedemptions && (
          <View style={styles.redemptionSection}>
            <View style={styles.redemptionHeader}>
              <ThemedText type="caption" secondary>
                {item.currentRedemptions} / {item.maxRedemptions} redeemed
              </ThemedText>
              <ThemedText type="caption" style={{ color: redemptionPercent >= 80 ? Colors.error : Colors.success }}>
                {item.maxRedemptions - item.currentRedemptions} left
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${redemptionPercent}%`,
                    backgroundColor: redemptionPercent >= 80 ? Colors.error : Colors.success,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <View style={[styles.flashActions, { borderTopColor: theme.border }]}>
          <Pressable
            style={[styles.flashActionButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => {
              // Copy share link
              Alert.alert("Share", "Link copied to clipboard!");
            }}
          >
            <Feather name="share-2" size={16} color={theme.text} />
            <ThemedText type="small" style={{ marginLeft: 6 }}>Share</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.flashActionButton, { backgroundColor: Colors.error + "15" }]}
            onPress={() => {
              Alert.alert(
                "End Flash Deal",
                "Are you sure you want to end this flash deal early?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "End Deal",
                    style: "destructive",
                    onPress: () => deleteFlashDeal(item.id),
                  },
                ]
              );
            }}
          >
            <Feather name="x" size={16} color={Colors.error} />
            <ThemedText type="small" style={{ marginLeft: 6, color: Colors.error }}>End</ThemedText>
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { paddingTop: headerHeight + Spacing.md, backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "regular" && { backgroundColor: theme.backgroundDefault, ...Shadows.sm },
            ]}
            onPress={() => setActiveTab("regular")}
          >
            <Feather name="tag" size={18} color={activeTab === "regular" ? Colors.primary : theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ marginLeft: 8, color: activeTab === "regular" ? Colors.primary : theme.textSecondary, fontWeight: activeTab === "regular" ? "600" : "400" }}
            >
              Promotions
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "flash" && { backgroundColor: theme.backgroundDefault, ...Shadows.sm },
            ]}
            onPress={() => setActiveTab("flash")}
          >
            <Feather name="zap" size={18} color={activeTab === "flash" ? Colors.error : theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ marginLeft: 8, color: activeTab === "flash" ? Colors.error : theme.textSecondary, fontWeight: activeTab === "flash" ? "600" : "400" }}
            >
              Flash Deals
            </ThemedText>
            {vendorFlashDeals.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: Colors.error }]}>
                <ThemedText type="caption" style={{ color: "#fff", fontWeight: "700" }}>
                  {vendorFlashDeals.length}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {activeTab === "regular" ? (
        <FlatList
          data={promotions}
          renderItem={renderPromotion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: Spacing.lg, paddingBottom: tabBarHeight + Spacing["5xl"] + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Spacer size="md" />}
          ListHeaderComponent={
            !hasPaidSubscription ? (
              <Pressable
                style={[styles.upgradeBanner, { backgroundColor: Colors.primary + "10", borderColor: Colors.primary }]}
                onPress={() => navigation.navigate("PricingTab")}
              >
                <View style={[styles.upgradeBannerIcon, { backgroundColor: Colors.primary + "20" }]}>
                  <Feather name="lock" size={24} color={Colors.primary} />
                </View>
                <View style={styles.upgradeBannerContent}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    Unlock Promotions
                  </ThemedText>
                  <ThemedText type="small" secondary>
                    Try our 7-Day Ad for $7.99 or subscribe to Pro for more features
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.primary} />
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: Colors.primary + "15" }]}>
                <Feather name="tag" size={40} color={Colors.primary} />
              </View>
              <Spacer size="lg" />
              <ThemedText type="h4">No promotions yet</ThemedText>
              <ThemedText type="body" secondary style={styles.emptyText}>
                {hasPaidSubscription
                  ? "Create your first promotion to start attracting customers"
                  : "Subscribe to create promotions and grow your business"}
              </ThemedText>
              {!hasPaidSubscription && (
                <>
                  <Spacer size="lg" />
                  <Pressable
                    style={[styles.upgradeButtonSimple, { backgroundColor: Colors.primary }]}
                    onPress={() => navigation.navigate("PricingTab")}
                  >
                    <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                      View Pricing Plans
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          }
        />
      ) : (
        <FlatList
          data={vendorFlashDeals}
          renderItem={renderFlashDeal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: Spacing.lg, paddingBottom: tabBarHeight + Spacing["5xl"] + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Spacer size="md" />}
          ListHeaderComponent={
            <>
              {!hasPaidSubscription && (
                <Pressable
                  style={[styles.upgradeBanner, { backgroundColor: Colors.error + "10", borderColor: Colors.error, marginBottom: Spacing.md }]}
                  onPress={() => navigation.navigate("PricingTab")}
                >
                  <View style={[styles.upgradeBannerIcon, { backgroundColor: Colors.error + "20" }]}>
                    <Feather name="zap" size={24} color={Colors.error} />
                  </View>
                  <View style={styles.upgradeBannerContent}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      Unlock Flash Deals
                    </ThemedText>
                    <ThemedText type="small" secondary>
                      Subscribe to send instant notifications to nearby customers
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={Colors.error} />
                </Pressable>
              )}
              <View style={[styles.flashInfoBanner, { backgroundColor: Colors.error + "10" }]}>
                <Feather name="info" size={16} color={Colors.error} />
                <ThemedText type="small" style={{ flex: 1, marginLeft: 10, color: theme.text }}>
                  Flash deals send instant push notifications to all nearby customers!
                </ThemedText>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: Colors.error + "15" }]}>
                <Feather name="zap" size={40} color={Colors.error} />
              </View>
              <Spacer size="lg" />
              <ThemedText type="h4">No flash deals active</ThemedText>
              <ThemedText type="body" secondary style={styles.emptyText}>
                {hasPaidSubscription
                  ? "Create a flash deal to instantly notify customers of a limited-time offer"
                  : "Subscribe to create flash deals and drive instant traffic"}
              </ThemedText>
              {!hasPaidSubscription && (
                <>
                  <Spacer size="lg" />
                  <Pressable
                    style={[styles.upgradeButtonSimple, { backgroundColor: Colors.error }]}
                    onPress={() => navigation.navigate("PricingTab")}
                  >
                    <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                      View Pricing Plans
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          }
        />
      )}

      <Pressable
        style={[
          styles.fab,
          {
            bottom: tabBarHeight + Spacing.xl,
            backgroundColor: activeTab === "regular" ? Colors.primary : Colors.error,
          },
        ]}
        onPress={() => {
          if (!hasPaidSubscription) {
            Alert.alert(
              "Upgrade Required",
              "Subscribe to a paid plan to create promotions and flash deals. Unlock powerful tools to grow your business!",
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
          activeTab === "regular" ? setShowModal(true) : setShowFlashModal(true);
        }}
      >
        <Feather name={activeTab === "regular" ? "plus" : "zap"} size={24} color="#fff" />
        {!hasPaidSubscription && (
          <View style={styles.lockBadge}>
            <Feather name="lock" size={10} color="#fff" />
          </View>
        )}
      </Pressable>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.modalContent,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { resetForm(); setShowModal(false); }}>
                <ThemedText type="body" style={{ color: Colors.primary }}>Cancel</ThemedText>
              </Pressable>
              <ThemedText type="h4">New Promotion</ThemedText>
              <Pressable onPress={handleCreate} disabled={!title || !description}>
                <ThemedText
                  type="body"
                  style={{ color: title && description ? Colors.primary : theme.textSecondary, fontWeight: "600" }}
                >
                  Create
                </ThemedText>
              </Pressable>
            </View>

            <Spacer size="lg" />

            {/* One-Tap Deal Templates */}
            <DealTemplates
              type="promotion"
              onSelectTemplate={handlePromotionTemplateSelect}
            />

            <Spacer size="lg" />

            {isSubscribed ? (
              <>
                <VoiceInput
                  placeholder="Describe your promotion by voice"
                  mode="generate-promo"
                  onTranscription={(text) => {
                    setTitle(text);
                  }}
                  onPromoGenerated={(promo) => {
                    setTitle(promo.title);
                    setDescription(promo.description);
                    // Try to extract price from suggestion if available
                    if (promo.suggestedDiscount) {
                      const discountMatch = promo.suggestedDiscount.match(/(\d+)/);
                      if (discountMatch) {
                        const discountPercent = parseInt(discountMatch[1], 10);
                        if (originalPrice) {
                          const original = parseFloat(originalPrice);
                          const discounted = original * (1 - discountPercent / 100);
                          setDiscountedPrice(discounted.toFixed(2));
                        }
                      }
                    }
                  }}
                  onError={(error) => {
                    if (Platform.OS === "web") {
                      Alert.alert("Voice Input", error);
                    }
                  }}
                />

                <Spacer size="md" />

                <Pressable
                  style={[styles.aiButton, { backgroundColor: Colors.accent + "20" }]}
                  onPress={handleAISuggest}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <Feather name="zap" size={18} color={Colors.accent} />
                  )}
                  <ThemedText type="body" style={{ color: Colors.accent, marginLeft: Spacing.sm, fontWeight: "600" }}>
                    {isGenerating ? "Generating..." : "AI Suggest"}
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[styles.upgradeButton, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary }]}
                onPress={() => {
                  setShowModal(false);
                  navigation.navigate("PricingTab");
                }}
              >
                <Feather name="lock" size={18} color={Colors.primary} />
                <View style={styles.upgradeTextContainer}>
                  <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
                    Unlock AI Features
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Subscribe to use voice input and AI suggestions
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.primary} />
              </Pressable>
            )}

            {showAISuggestions ? (
              <View style={styles.suggestionsContainer}>
                <ThemedText type="small" secondary style={styles.suggestionsLabel}>
                  Tap to use a suggestion:
                </ThemedText>
                {AI_SUGGESTIONS.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={[styles.suggestionCard, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => applyAISuggestion(suggestion)}
                  >
                    <ThemedText type="small">{suggestion}</ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Spacer size="xl" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Promotion Title</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Taco Tuesday Special"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Description</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="Describe your promotion..."
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Spacer size="lg" />

            <View style={styles.priceInputRow}>
              <View style={styles.priceInputContainer}>
                <ThemedText type="small" secondary style={styles.inputLabel}>Original Price</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.priceInputContainer}>
                <ThemedText type="small" secondary style={styles.inputLabel}>Sale Price</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={discountedPrice}
                  onChangeText={setDiscountedPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Category</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {FOOD_CATEGORIES.filter(c => c.id !== "All").map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categorySelectorChip,
                    { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                    selectedCategory === category.id && {
                      backgroundColor: category.color + "20",
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Feather
                    name={category.icon as any}
                    size={14}
                    color={selectedCategory === category.id ? category.color : theme.textSecondary}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      marginLeft: 4,
                      color: selectedCategory === category.id ? category.color : theme.text,
                    }}
                  >
                    {category.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <Spacer size="lg" />

            <View style={styles.switchRow}>
              <View>
                <ThemedText type="body">Activate Immediately</ThemedText>
                <ThemedText type="small" secondary>Promotion goes live when created</ThemedText>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: theme.backgroundTertiary, true: Colors.success + "60" }}
                thumbColor={isActive ? Colors.success : theme.backgroundSecondary}
              />
            </View>

            <Spacer size="2xl" />

            <Pressable
              style={[
                styles.createButton,
                {
                  backgroundColor: title && description && originalPrice && discountedPrice ? Colors.primary : theme.backgroundTertiary,
                },
              ]}
              onPress={handleCreate}
              disabled={!title || !description || !originalPrice || !discountedPrice}
            >
              <Feather name="plus" size={20} color="#fff" />
              <ThemedText type="body" style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>
                Create Promotion
              </ThemedText>
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>

      {/* Flash Deal Creation Modal */}
      <Modal visible={showFlashModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.modalContent,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { resetFlashForm(); setShowFlashModal(false); }}>
                <ThemedText type="body" style={{ color: Colors.error }}>Cancel</ThemedText>
              </Pressable>
              <View style={styles.flashModalTitle}>
                <Feather name="zap" size={20} color={Colors.error} />
                <ThemedText type="h4" style={{ marginLeft: 8 }}>Flash Deal</ThemedText>
              </View>
              <Pressable
                onPress={handleCreateFlashDeal}
                disabled={!flashTitle || !flashDescription || !flashOriginalPrice || isCreatingFlash}
              >
                {isCreatingFlash ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <ThemedText
                    type="body"
                    style={{
                      color: flashTitle && flashDescription && flashOriginalPrice ? Colors.error : theme.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    Launch
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <Spacer size="lg" />

            {/* One-Tap Flash Deal Templates */}
            <DealTemplates
              type="flash"
              onSelectTemplate={handleFlashTemplateSelect}
            />

            <Spacer size="md" />

            {/* Flash Deal Banner */}
            <View style={[styles.flashBannerPreview, { backgroundColor: Colors.error + "10" }]}>
              <Feather name="zap" size={24} color={Colors.error} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Instant Notifications
                </ThemedText>
                <ThemedText type="small" secondary>
                  All nearby customers will be notified immediately when you launch this deal
                </ThemedText>
              </View>
            </View>

            <Spacer size="xl" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Deal Title</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., 50% OFF All Tacos!"
              placeholderTextColor={theme.textSecondary}
              value={flashTitle}
              onChangeText={setFlashTitle}
            />

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Description</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="Make it exciting! Limited time only..."
              placeholderTextColor={theme.textSecondary}
              value={flashDescription}
              onChangeText={setFlashDescription}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <Spacer size="lg" />

            <View style={styles.priceInputRow}>
              <View style={styles.priceInputContainer}>
                <ThemedText type="small" secondary style={styles.inputLabel}>Original Price</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={flashOriginalPrice}
                  onChangeText={setFlashOriginalPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.priceInputContainer}>
                <ThemedText type="small" secondary style={styles.inputLabel}>Discount %</ThemedText>
                <View style={[styles.discountInputWrapper, { borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.discountInput, { color: Colors.error }]}
                    value={flashDiscountPercent}
                    onChangeText={setFlashDiscountPercent}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <ThemedText type="h4" style={{ color: Colors.error }}>%</ThemedText>
                </View>
              </View>
            </View>

            {flashOriginalPrice && flashDiscountPercent && (
              <View style={styles.pricePreview}>
                <ThemedText type="small" secondary>Final Price: </ThemedText>
                <ThemedText type="h4" style={{ color: Colors.success }}>
                  ${(parseFloat(flashOriginalPrice || "0") * (1 - parseInt(flashDiscountPercent || "0", 10) / 100)).toFixed(2)}
                </ThemedText>
              </View>
            )}

            <Spacer size="xl" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Duration</ThemedText>
            <View style={styles.durationOptions}>
              {FLASH_DURATIONS.map((duration) => (
                <Pressable
                  key={duration.value}
                  style={[
                    styles.durationChip,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                    flashDuration === duration.value && { backgroundColor: duration.color + "20", borderColor: duration.color },
                  ]}
                  onPress={() => setFlashDuration(duration.value)}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: flashDuration === duration.value ? duration.color : theme.text,
                      fontWeight: flashDuration === duration.value ? "600" : "400",
                    }}
                  >
                    {duration.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Max Redemptions (Optional)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., 50 (leave empty for unlimited)"
              placeholderTextColor={theme.textSecondary}
              value={flashMaxRedemptions}
              onChangeText={setFlashMaxRedemptions}
              keyboardType="number-pad"
            />

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Category</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {FOOD_CATEGORIES.filter((c) => c.id !== "All").map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categorySelectorChip,
                    { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                    flashCategory === category.id && {
                      backgroundColor: category.color + "20",
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => setFlashCategory(category.id)}
                >
                  <Feather
                    name={category.icon as any}
                    size={14}
                    color={flashCategory === category.id ? category.color : theme.textSecondary}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      marginLeft: 4,
                      color: flashCategory === category.id ? category.color : theme.text,
                    }}
                  >
                    {category.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <Spacer size="2xl" />

            <Pressable
              style={[
                styles.launchButton,
                {
                  backgroundColor: flashTitle && flashDescription && flashOriginalPrice ? Colors.error : theme.backgroundTertiary,
                },
              ]}
              onPress={handleCreateFlashDeal}
              disabled={!flashTitle || !flashDescription || !flashOriginalPrice || isCreatingFlash}
            >
              {isCreatingFlash ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="zap" size={20} color="#fff" />
                  <ThemedText type="body" style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>
                    Launch Flash Deal
                  </ThemedText>
                </>
              )}
            </Pressable>

          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  promoCard: {
    padding: 0,
  },
  promoHeader: {
    padding: Spacing.md,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoDesc: {
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  priceInfo: {},
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  savingsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  promoActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.fab,
  },
  lockBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  suggestionsContainer: {
    marginTop: Spacing.lg,
  },
  suggestionsLabel: {
    marginBottom: Spacing.sm,
  },
  suggestionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  priceInputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  categorySelectorChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  // Tab styles
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  // Flash deal card styles
  flashCard: {
    padding: 0,
    overflow: "hidden",
  },
  flashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  flashBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  flashBadgeText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 4,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  flashContent: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  flashDiscountCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  flashInfo: {
    flex: 1,
    justifyContent: "center",
  },
  flashPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  flashOriginalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  redemptionSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  redemptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  flashActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  flashActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  flashInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  // Flash modal styles
  flashModalTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  flashBannerPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  discountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  discountInput: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    width: 50,
  },
  pricePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  durationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  durationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  launchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  upgradeBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  upgradeBannerContent: {
    flex: 1,
  },
  upgradeButtonSimple: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
});
