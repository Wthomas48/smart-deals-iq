import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Image, TextInput, Platform, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as LocationModule from "expo-location";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { Button } from "@/components/Button";
import { CategoryFilter } from "@/components/CategoryFilter";
import { LocationSearch } from "@/components/LocationSearch";
import { useTheme } from "@/hooks/useTheme";
import { useData, FlashDeal } from "@/lib/data-context";
import { useLocation } from "@/lib/location-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { CustomerStackParamList } from "@/navigation/CustomerTabNavigator";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function DealsFeedScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const {
    vendors,
    isFavorite,
    addFavorite,
    removeFavorite,
    getFilteredDeals,
    getFilteredVendors,
    searchLocation,
    selectedCategory,
    getActiveFlashDeals,
    redeemFlashDeal,
  } = useData();
  const locationContext = useLocation();
  const { userLocation, locationPermission, requestPermission, calculateDistance, refreshLocation, isLoading: locationLoading } = locationContext;
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Flash deals with countdown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeFlashDeals = useMemo(() => getActiveFlashDeals(), [getActiveFlashDeals]);

  const dealsWithVendors = useMemo(() => {
    const filteredDeals = getFilteredDeals();
    const filteredVendors = getFilteredVendors();

    return filteredDeals.map((deal) => {
      const vendor = filteredVendors.find((v) => v.id === deal.vendorId);
      let distance: string;
      if (vendor && userLocation) {
        const dist = calculateDistance(vendor.latitude, vendor.longitude);
        distance = dist != null ? dist.toFixed(1) : "?";
      } else if (vendor && searchLocation) {
        // Use city location if user location not available
        distance = "< 5";
      } else {
        distance = "?";
      }
      return { ...deal, vendor, distance };
    }).filter((deal) => {
      if (!deal.vendor) return false;
      const matchesSearch = searchQuery === "" ||
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.vendor.city && deal.vendor.city.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    }).sort((a, b) => {
      const distA = parseFloat(a.distance) || 999;
      const distB = parseFloat(b.distance) || 999;
      return distA - distB;
    });
  }, [getFilteredDeals, getFilteredVendors, userLocation, calculateDistance, searchQuery, searchLocation]);

  const onRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await refreshLocation();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  if (locationPermission !== LocationModule.PermissionStatus.GRANTED && !locationLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.permissionContainer, { paddingTop: headerHeight }]}>
          <View style={[styles.permissionCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="map-pin" size={48} color={Colors.primary} />
            <Spacer size="lg" />
            <ThemedText type="h3" style={styles.permissionTitle}>
              Enable Location
            </ThemedText>
            <ThemedText type="body" secondary style={styles.permissionText}>
              SmartDealsIQ™ needs your location to show nearby deals from restaurants and local businesses
            </ThemedText>
            <Spacer size="xl" />
            <Button onPress={requestPermission}>Enable Location</Button>
          </View>
        </View>
      </ThemedView>
    );
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getFlashTimeRemaining = (expiresAt: string): string => {
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

  const getFlashTimeColor = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = diff / (1000 * 60);

    if (minutes <= 5) return Colors.error;
    if (minutes <= 15) return "#F97316";
    if (minutes <= 30) return "#F59E0B";
    return Colors.success;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return diff < 3600000 && diff > 0;
  };

  const toggleFavorite = async (vendorId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isFavorite(vendorId)) {
      await removeFavorite(vendorId);
    } else {
      await addFavorite(vendorId);
    }
  };

  const renderDealCard = ({ item }: { item: typeof dealsWithVendors[0] }) => {
    if (!item.vendor) return null;
    
    const expiringSoon = isExpiringSoon(item.expiresAt);
    const timeRemaining = getTimeRemaining(item.expiresAt);

    return (
      <Card
        style={styles.dealCard}
        onPress={() => navigation.navigate("DealDetail", { dealId: item.id })}
      >
        <View style={styles.dealHeader}>
          <Image
            source={{ uri: item.vendor.image || "https://via.placeholder.com/64" }}
            style={styles.vendorImage}
          />
          <View style={styles.dealInfo}>
            <View style={styles.vendorNameRow}>
              <ThemedText type="h4" numberOfLines={1} style={styles.vendorName}>
                {item.vendor.name}
              </ThemedText>
              <Pressable
                onPress={() => toggleFavorite(item.vendor!.id)}
                hitSlop={8}
                style={styles.favoriteButton}
              >
                <Feather
                  name={isFavorite(item.vendor.id) ? "heart" : "heart"}
                  size={20}
                  color={isFavorite(item.vendor.id) ? Colors.error : theme.textSecondary}
                  style={{ opacity: isFavorite(item.vendor.id) ? 1 : 0.5 }}
                />
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.distanceBadge, { backgroundColor: Colors.secondary }]}>
                <Feather name="map-pin" size={12} color="#fff" />
                <ThemedText type="caption" style={styles.distanceText}>
                  {item.distance} mi
                </ThemedText>
              </View>
              <View style={styles.ratingContainer}>
                <Feather name="star" size={14} color={Colors.accent} />
                <ThemedText type="small" style={styles.ratingText}>
                  {item.vendor.rating}
                </ThemedText>
              </View>
              {item.vendor.isOpen ? (
                <View style={[styles.statusBadge, { backgroundColor: Colors.success + "20" }]}>
                  <ThemedText type="caption" style={{ color: Colors.success }}>Open</ThemedText>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: Colors.error + "20" }]}>
                  <ThemedText type="caption" style={{ color: Colors.error }}>Closed</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.dealContent, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.dealTitleRow}>
            <ThemedText type="body" style={styles.dealTitle}>{item.title}</ThemedText>
            <View style={[
              styles.timeBadge,
              { backgroundColor: expiringSoon ? Colors.accent : theme.backgroundTertiary }
            ]}>
              <Feather name="clock" size={12} color={expiringSoon ? "#000" : theme.textSecondary} />
              <ThemedText
                type="caption"
                style={{ color: expiringSoon ? "#000" : theme.textSecondary, marginLeft: 4 }}
              >
                {timeRemaining}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" secondary numberOfLines={2}>{item.description}</ThemedText>
          <View style={styles.priceRow}>
            <ThemedText type="small" style={styles.originalPrice}>
              ${item.originalPrice.toFixed(2)}
            </ThemedText>
            <ThemedText type="h4" style={{ color: Colors.success }}>
              ${item.discountedPrice.toFixed(2)}
            </ThemedText>
            <View style={[styles.savingsBadge, { backgroundColor: Colors.primary }]}>
              <ThemedText type="caption" style={styles.savingsText}>
                Save ${(item.originalPrice - item.discountedPrice).toFixed(2)}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderFlashDealCard = (deal: FlashDeal) => {
    const timeRemaining = getFlashTimeRemaining(deal.expiresAt);
    const timeColor = getFlashTimeColor(deal.expiresAt);
    const redemptionPercent = deal.maxRedemptions
      ? (deal.currentRedemptions / deal.maxRedemptions) * 100
      : 0;

    return (
      <Pressable
        key={deal.id}
        style={[styles.flashDealCard, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          // Navigate to deal or show modal
        }}
      >
        <View style={[styles.flashBadge, { backgroundColor: Colors.error }]}>
          <Feather name="zap" size={10} color="#fff" />
          <ThemedText type="caption" style={styles.flashBadgeText}>FLASH</ThemedText>
        </View>

        <View style={styles.flashDealDiscount}>
          <ThemedText type="h3" style={{ color: Colors.error }}>{deal.discountPercent}%</ThemedText>
          <ThemedText type="caption" style={{ color: Colors.error }}>OFF</ThemedText>
        </View>

        <View style={styles.flashDealInfo}>
          <ThemedText type="small" style={{ fontWeight: "600" }} numberOfLines={1}>
            {deal.vendorName}
          </ThemedText>
          <ThemedText type="caption" secondary numberOfLines={1}>{deal.title}</ThemedText>
        </View>

        <View style={[styles.flashTimer, { backgroundColor: timeColor + "15" }]}>
          <Feather name="clock" size={12} color={timeColor} />
          <ThemedText type="caption" style={{ color: timeColor, fontWeight: "700", marginLeft: 4 }}>
            {timeRemaining}
          </ThemedText>
        </View>

        {deal.maxRedemptions && (
          <View style={styles.flashProgress}>
            <View style={[styles.flashProgressBar, { backgroundColor: theme.backgroundTertiary }]}>
              <View
                style={[
                  styles.flashProgressFill,
                  {
                    width: `${redemptionPercent}%`,
                    backgroundColor: redemptionPercent >= 80 ? Colors.error : Colors.success,
                  },
                ]}
              />
            </View>
            <ThemedText type="caption" style={{ fontSize: 10 }}>
              {deal.maxRedemptions - deal.currentRedemptions} left
            </ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Location Search */}
      <LocationSearch />
      <Spacer size="lg" />

      {/* Flash Deals Section */}
      {activeFlashDeals.length > 0 && (
        <>
          <View style={styles.flashDealsHeader}>
            <View style={styles.flashDealsTitle}>
              <Feather name="zap" size={18} color={Colors.error} />
              <ThemedText type="h4" style={{ marginLeft: 8, color: Colors.error }}>
                Flash Deals
              </ThemedText>
              <View style={[styles.flashCountBadge, { backgroundColor: Colors.error }]}>
                <ThemedText type="caption" style={{ color: "#fff", fontWeight: "700" }}>
                  {activeFlashDeals.length}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="caption" secondary>Limited time offers</ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flashDealsScroll}
          >
            {activeFlashDeals.map(renderFlashDealCard)}
          </ScrollView>
          <Spacer size="lg" />
        </>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
        <Feather name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search deals, vendors, cities..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <Spacer size="lg" />

      {/* Category Filter */}
      <CategoryFilter />
      <Spacer size="md" />

      {/* Results count */}
      <View style={styles.resultsRow}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {dealsWithVendors.length} Deal{dealsWithVendors.length !== 1 ? "s" : ""} Available
        </ThemedText>
        {searchLocation && (
          <View style={[styles.locationBadge, { backgroundColor: Colors.primary + "15" }]}>
            <Feather name="map-pin" size={12} color={Colors.primary} />
            <ThemedText type="caption" style={{ color: Colors.primary, marginLeft: 4 }}>
              {searchLocation.city}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={dealsWithVendors}
        renderItem={renderDealCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ItemSeparatorComponent={() => <Spacer size="md" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={48} color={theme.textSecondary} />
            <Spacer size="lg" />
            <ThemedText type="h4">No deals found</ThemedText>
            <ThemedText type="body" secondary style={styles.emptyText}>
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search or filters"
                : "Check back later for new deals"}
            </ThemedText>
          </View>
        }
      />
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
  dealCard: {
    padding: 0,
    overflow: "hidden",
  },
  dealHeader: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  vendorImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
  },
  dealInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vendorName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  distanceText: {
    color: "#fff",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  dealContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    margin: Spacing.sm,
    marginTop: 0,
  },
  dealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  dealTitle: {
    flex: 1,
    fontWeight: "600",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  savingsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  savingsText: {
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionCard: {
    width: "100%",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  permissionTitle: {
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  // Flash deals styles
  flashDealsHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  flashDealsTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  flashCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  flashDealsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  flashDealCard: {
    width: 160,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    position: "relative",
  },
  flashBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  flashBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 8,
    marginLeft: 2,
  },
  flashDealDiscount: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  flashDealInfo: {
    marginBottom: Spacing.sm,
  },
  flashTimer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  flashProgress: {
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  flashProgressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  flashProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
