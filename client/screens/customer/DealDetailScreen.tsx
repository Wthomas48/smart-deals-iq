import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type RouteParams = RouteProp<CustomerStackParamList, "DealDetail">;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function DealDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { deals, vendors, isFavorite, addFavorite, removeFavorite } = useData();
  const { calculateDistance } = useLocation();
  
  const { dealId } = route.params;
  const deal = deals.find((d) => d.id === dealId);
  const vendor = deal ? vendors.find((v) => v.id === deal.vendorId) : null;
  
  if (!deal || !vendor) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <Spacer size="lg" />
          <ThemedText type="h4">Deal not found</ThemedText>
          <Spacer size="lg" />
          <Button onPress={() => navigation.goBack()}>Go Back</Button>
        </View>
      </ThemedView>
    );
  }
  
  const favorited = isFavorite(vendor.id);
  const distance = calculateDistance(vendor.latitude, vendor.longitude);
  const savings = deal.originalPrice - deal.discountedPrice;
  const savingsPercent = Math.round((savings / deal.originalPrice) * 100);
  
  const handleToggleFavorite = () => {
    if (favorited) {
      removeFavorite(vendor.id);
    } else {
      addFavorite(vendor.id);
    }
  };
  
  const handleViewVendor = () => {
    navigation.navigate("VendorDetail", { vendorId: vendor.id });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.dealBanner, { backgroundColor: Colors.primary }]}>
          <View style={styles.savingsBadge}>
            <ThemedText type="h2" style={styles.savingsText}>
              {savingsPercent}% OFF
            </ThemedText>
          </View>
          <ThemedText type="caption" style={styles.saveAmount}>
            Save ${savings.toFixed(2)}
          </ThemedText>
        </View>
        
        <View style={styles.content}>
          <ThemedText type="h2">{deal.title}</ThemedText>
          <Spacer size="sm" />
          <ThemedText type="body" secondary>{deal.description}</ThemedText>
          
          <Spacer size="xl" />
          
          <View style={styles.priceContainer}>
            <View>
              <ThemedText type="caption" secondary>Original Price</ThemedText>
              <ThemedText type="h4" style={styles.originalPrice}>
                ${deal.originalPrice.toFixed(2)}
              </ThemedText>
            </View>
            <Feather name="arrow-right" size={24} color={theme.textSecondary} />
            <View>
              <ThemedText type="caption" secondary>Deal Price</ThemedText>
              <ThemedText type="h3" style={{ color: Colors.success }}>
                ${deal.discountedPrice.toFixed(2)}
              </ThemedText>
            </View>
          </View>
          
          <Spacer size="xl" />
          
          <Card style={styles.vendorCard}>
            <Pressable onPress={handleViewVendor} style={styles.vendorRow}>
              <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
              <View style={styles.vendorInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>{vendor.name}</ThemedText>
                <ThemedText type="small" secondary>{vendor.cuisine}</ThemedText>
                <View style={styles.metaRow}>
                  {distance !== null ? (
                    <View style={[styles.distanceBadge, { backgroundColor: Colors.secondary }]}>
                      <Feather name="map-pin" size={12} color="#fff" />
                      <ThemedText type="caption" style={styles.distanceText}>
                        {distance.toFixed(1)} mi
                      </ThemedText>
                    </View>
                  ) : null}
                  <View style={styles.ratingContainer}>
                    <Feather name="star" size={14} color={Colors.accent} />
                    <ThemedText type="small" style={styles.ratingText}>{vendor.rating}</ThemedText>
                  </View>
                </View>
              </View>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </Pressable>
          </Card>
          
          <Spacer size="xl" />
          
          <View style={styles.detailsSection}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>Deal Details</ThemedText>
            <Spacer size="md" />
            
            <View style={styles.detailRow}>
              <Feather name="clock" size={18} color={theme.textSecondary} />
              <ThemedText type="body" secondary style={styles.detailText}>
                Valid until {new Date(deal.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="tag" size={18} color={theme.textSecondary} />
              <ThemedText type="body" secondary style={styles.detailText}>
                Limited time offer
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={18} color={theme.textSecondary} />
              <ThemedText type="body" secondary style={styles.detailText}>
                {distance !== null ? `${distance.toFixed(1)} miles away` : "Location available"}
              </ThemedText>
            </View>
          </View>
          
          <Spacer size="2xl" />
          
          <View style={styles.actionButtons}>
            <Button onPress={handleViewVendor} style={styles.primaryButton}>
              View Vendor
            </Button>
            <Spacer size="md" />
            <Pressable
              onPress={handleToggleFavorite}
              style={[
                styles.favoriteButton,
                { backgroundColor: favorited ? Colors.primary + "20" : theme.backgroundSecondary },
              ]}
            >
              <Feather
                name={favorited ? "heart" : "heart"}
                size={20}
                color={favorited ? Colors.primary : theme.textSecondary}
              />
              <ThemedText
                type="body"
                style={{ color: favorited ? Colors.primary : theme.text, marginLeft: Spacing.sm }}
              >
                {favorited ? "Saved to Favorites" : "Save to Favorites"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  dealBanner: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  savingsBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  savingsText: {
    color: "#fff",
  },
  saveAmount: {
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: BorderRadius.md,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  vendorCard: {
    padding: 0,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  vendorImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
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
    paddingVertical: 2,
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
  detailsSection: {
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: BorderRadius.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  detailText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  primaryButton: {
    width: "100%",
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
