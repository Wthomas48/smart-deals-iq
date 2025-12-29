import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Image, TextInput, ScrollView } from "react-native";
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
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/lib/data-context";
import { useLocation } from "@/lib/location-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { CustomerStackParamList } from "@/navigation/CustomerTabNavigator";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

const CUISINE_FILTERS = ["All", "Mexican", "Korean", "Italian", "Indian", "American", "Asian"];

export default function DealsFeedScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { vendors, deals, isFavorite, addFavorite, removeFavorite } = useData();
  const locationContext = useLocation();
  const { userLocation, locationPermission, requestPermission, calculateDistance, refreshLocation, isLoading: locationLoading } = locationContext;
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  const dealsWithVendors = useMemo(() => {
    return deals.map((deal) => {
      const vendor = vendors.find((v) => v.id === deal.vendorId);
      let distance: string;
      if (vendor && userLocation) {
        const dist = calculateDistance(vendor.latitude, vendor.longitude);
        distance = dist !== null ? dist.toFixed(1) : "?";
      } else {
        distance = "?";
      }
      return { ...deal, vendor, distance };
    }).filter((deal) => {
      if (!deal.vendor) return false;
      const matchesSearch = searchQuery === "" || 
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCuisine = selectedCuisine === "All" || 
        deal.vendor.cuisine.toLowerCase() === selectedCuisine.toLowerCase();
      return matchesSearch && matchesCuisine;
    }).sort((a, b) => {
      const distA = parseFloat(a.distance) || 999;
      const distB = parseFloat(b.distance) || 999;
      return distA - distB;
    });
  }, [deals, vendors, userLocation, calculateDistance, searchQuery, selectedCuisine]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              SmartDealsIQ needs your location to show nearby deals from restaurants and local businesses
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

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return diff < 3600000 && diff > 0;
  };

  const toggleFavorite = async (vendorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          <Image source={{ uri: item.vendor.image }} style={styles.vendorImage} />
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
        <Feather name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search deals, vendors..."
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filtersContainer}
      >
        {CUISINE_FILTERS.map((cuisine) => (
          <Pressable
            key={cuisine}
            style={[
              styles.filterChip,
              { 
                backgroundColor: selectedCuisine === cuisine ? Colors.primary : theme.backgroundSecondary,
                borderColor: selectedCuisine === cuisine ? Colors.primary : theme.border,
              }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCuisine(cuisine);
            }}
          >
            <ThemedText 
              type="small" 
              style={{ color: selectedCuisine === cuisine ? "#fff" : theme.text }}
            >
              {cuisine}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      <Spacer size="sm" />
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
              {searchQuery || selectedCuisine !== "All" 
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
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filtersContainer: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
