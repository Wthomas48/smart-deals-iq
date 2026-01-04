import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, Platform } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { ShareSheet } from "@/components/ShareSheet";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { CustomerStackParamList } from "@/navigation/CustomerTabNavigator";
import * as Haptics from "expo-haptics";

type VendorDetailRouteProp = RouteProp<CustomerStackParamList, "VendorDetail">;

type TabType = "deals" | "menu" | "schedule";

export default function VendorDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<VendorDetailRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getVendorById, getDealsByVendor, isFavorite, addFavorite, removeFavorite } = useData();

  const vendor = getVendorById(route.params.vendorId);
  const deals = getDealsByVendor(route.params.vendorId);
  const [activeTab, setActiveTab] = useState<TabType>("deals");
  const [showShareSheet, setShowShareSheet] = useState(false);

  if (!vendor) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Vendor not found</ThemedText>
      </ThemedView>
    );
  }

  const favorite = isFavorite(vendor.id);

  const toggleFavorite = async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (favorite) {
      await removeFavorite(vendor.id);
    } else {
      await addFavorite(vendor.id);
    }
  };

  const handleShare = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowShareSheet(true);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const menuItems = [
    { name: "Signature Tacos (3)", price: "$12.99" },
    { name: "Burrito Supreme", price: "$14.99" },
    { name: "Nachos Grande", price: "$10.99" },
    { name: "Quesadilla", price: "$9.99" },
    { name: "Churros", price: "$5.99" },
  ];

  const schedule = [
    { day: "Monday", hours: "11am - 8pm", location: "Financial District" },
    { day: "Tuesday", hours: "11am - 8pm", location: "Mission District" },
    { day: "Wednesday", hours: "11am - 8pm", location: "SoMa" },
    { day: "Thursday", hours: "11am - 9pm", location: "Castro" },
    { day: "Friday", hours: "11am - 10pm", location: "Marina" },
    { day: "Saturday", hours: "12pm - 10pm", location: "Golden Gate Park" },
    { day: "Sunday", hours: "Closed", location: "-" },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        <Image source={{ uri: vendor.image }} style={styles.heroImage} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <ThemedText type="h2">{vendor.name}</ThemedText>
              <View style={styles.metaRow}>
                <Feather name="star" size={16} color={Colors.accent} />
                <ThemedText type="body" style={styles.ratingText}>
                  {vendor.rating} ({vendor.reviewCount} reviews)
                </ThemedText>
              </View>
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="caption">{vendor.cuisine}</ThemedText>
                </View>
                <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="caption">{vendor.priceRange}</ThemedText>
                </View>
                {vendor.isOpen ? (
                  <View style={[styles.tag, { backgroundColor: Colors.success + "20" }]}>
                    <ThemedText type="caption" style={{ color: Colors.success }}>Open</ThemedText>
                  </View>
                ) : (
                  <View style={[styles.tag, { backgroundColor: Colors.error + "20" }]}>
                    <ThemedText type="caption" style={{ color: Colors.error }}>Closed</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: favorite ? Colors.error + "15" : theme.backgroundSecondary }]}
              onPress={toggleFavorite}
            >
              <Feather
                name="heart"
                size={20}
                color={favorite ? Colors.error : theme.textSecondary}
              />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: favorite ? Colors.error : theme.text }}>
                {favorite ? "Following" : "Follow"}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={handleShare}
            >
              <Feather name="share" size={20} color={theme.textSecondary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>Share</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="body" secondary style={styles.description}>
            {vendor.description}
          </ThemedText>

          {vendor.dietary.length > 0 ? (
            <View style={styles.dietaryRow}>
              {vendor.dietary.map((diet) => (
                <View key={diet} style={[styles.dietaryTag, { backgroundColor: Colors.secondary + "15" }]}>
                  <ThemedText type="caption" style={{ color: Colors.secondary }}>{diet}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          <Spacer size="xl" />

          <View style={styles.tabContainer}>
            {(["deals", "menu", "schedule"] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomColor: Colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <ThemedText
                  type="body"
                  style={[
                    styles.tabText,
                    activeTab === tab ? { color: Colors.primary, fontWeight: "600" } : { color: theme.textSecondary },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "deals" && deals.length > 0 ? ` (${deals.length})` : ""}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Spacer size="lg" />

          {activeTab === "deals" ? (
            deals.length > 0 ? (
              deals.map((deal) => (
                <Card key={deal.id} style={styles.dealCard}>
                  <View style={styles.dealHeader}>
                    <ThemedText type="h4">{deal.title}</ThemedText>
                    <View style={[styles.timeBadge, { backgroundColor: Colors.accent }]}>
                      <Feather name="clock" size={12} color="#000" />
                      <ThemedText type="caption" style={{ color: "#000", marginLeft: 4 }}>
                        {getTimeRemaining(deal.expiresAt)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="body" secondary>{deal.description}</ThemedText>
                  <View style={styles.priceRow}>
                    <ThemedText type="body" style={styles.originalPrice}>
                      ${deal.originalPrice.toFixed(2)}
                    </ThemedText>
                    <ThemedText type="h3" style={{ color: Colors.success }}>
                      ${deal.discountedPrice.toFixed(2)}
                    </ThemedText>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyTab}>
                <Feather name="tag" size={32} color={theme.textSecondary} />
                <ThemedText type="body" secondary style={styles.emptyText}>
                  No active deals right now
                </ThemedText>
              </View>
            )
          ) : null}

          {activeTab === "menu" ? (
            <Card style={styles.menuCard}>
              {menuItems.map((item, index) => (
                <View
                  key={item.name}
                  style={[
                    styles.menuItem,
                    index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}
                >
                  <ThemedText type="body">{item.name}</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>{item.price}</ThemedText>
                </View>
              ))}
            </Card>
          ) : null}

          {activeTab === "schedule" ? (
            <Card style={styles.scheduleCard}>
              {schedule.map((day, index) => (
                <View
                  key={day.day}
                  style={[
                    styles.scheduleItem,
                    index < schedule.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={styles.scheduleDay}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>{day.day}</ThemedText>
                    <ThemedText type="small" secondary>{day.hours}</ThemedText>
                  </View>
                  <ThemedText type="small" secondary>{day.location}</ThemedText>
                </View>
              ))}
            </Card>
          ) : null}
        </View>
      </ScrollView>

      {/* Share Sheet */}
      <ShareSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        truckData={{
          truckName: vendor.name,
          location: vendor.address || vendor.city || undefined,
          isOpen: vendor.isOpen,
          cuisineType: vendor.cuisine,
          deal: deals.length > 0 ? `${deals.length} deals available!` : undefined,
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 220,
  },
  content: {
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  ratingText: {
    marginLeft: Spacing.xs,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  description: {
    marginTop: Spacing.lg,
  },
  dietaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dietaryTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {},
  dealCard: {
    marginBottom: Spacing.md,
  },
  dealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  scheduleCard: {
    padding: 0,
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  scheduleDay: {},
  emptyTab: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});
