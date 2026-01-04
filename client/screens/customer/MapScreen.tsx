import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Platform, Dimensions, Image, Linking } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useData, Vendor } from "@/lib/data-context";
import { useVendorListing, PublicVendorListing } from "@/lib/vendor-listing-context";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { CustomerStackParamList } from "@/navigation/CustomerTabNavigator";

// Conditionally import react-native-maps for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    if (__DEV__) console.log("react-native-maps not available");
  }
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

const { width } = Dimensions.get("window");

const RADIUS_OPTIONS = [1, 5, 10];

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  food_truck: "Food Truck",
  restaurant: "Restaurant",
  vendor: "Vendor/Cart",
};

export default function MapScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { vendors, deals, isFavorite } = useData();
  const { publicVendors, fetchPublicVendors } = useVendorListing();
  const mapRef = useRef<any>(null);

  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedFreeVendor, setSelectedFreeVendor] = useState<PublicVendorListing | null>(null);
  const [radiusIndex, setRadiusIndex] = useState(1);

  // Fetch free vendors on mount
  useEffect(() => {
    fetchPublicVendors();
  }, []);

  useEffect(() => {
    if (permission?.granted) {
      getCurrentLocation();
    }
  }, [permission]);

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
    }
  };

  const handleMarkerPress = (vendor: Vendor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVendor(vendor);
    setSelectedFreeVendor(null);
    mapRef.current?.animateToRegion({
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleFreeVendorMarkerPress = (vendor: PublicVendorListing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFreeVendor(vendor);
    setSelectedVendor(null);
    mapRef.current?.animateToRegion({
      latitude: vendor.locationLat,
      longitude: vendor.locationLng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const getVendorDeals = (vendorId: string) => {
    return deals.filter((d) => d.vendorId === vendorId);
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const openDirections = (lat: number, lng: number, name: string) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url);
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ThemedText type="body">Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.permissionContainer, { paddingTop: headerHeight }]}>
          <View style={[styles.permissionCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="map-pin" size={48} color={Colors.primary} />
            <Spacer size="lg" />
            <ThemedText type="h3" style={styles.permissionTitle}>
              Enable Location
            </ThemedText>
            <ThemedText type="body" secondary style={styles.permissionText}>
              SmartDealsIQ™ needs your location to show nearby restaurants and local businesses
            </ThemedText>
            <Spacer size="xl" />
            <Button onPress={requestPermission}>Enable Location</Button>
          </View>
        </View>
      </ThemedView>
    );
  }

  const initialRegion: Region = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  if (Platform.OS === "web" || !MapView) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.permissionContainer, { paddingTop: headerHeight }]}>
          <View style={[styles.permissionCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="map" size={48} color={Colors.primary} />
            <Spacer size="lg" />
            <ThemedText type="h3" style={styles.permissionTitle}>
              Map View
            </ThemedText>
            <ThemedText type="body" secondary style={styles.permissionText}>
              The interactive map is available in Expo Go on your mobile device. Scan the QR code to experience the full map features.
            </ThemedText>
            <Spacer size="lg" />
            <View style={styles.vendorListWeb}>
              {vendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  style={styles.vendorCardWeb}
                  onPress={() => navigation.navigate("VendorDetail", { vendorId: vendor.id })}
                >
                  <View style={styles.vendorCardContent}>
                    <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
                    <View style={styles.vendorInfo}>
                      <ThemedText type="h4" numberOfLines={1}>{vendor.name}</ThemedText>
                      <ThemedText type="small" secondary>{vendor.cuisine}</ThemedText>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => {
          setSelectedVendor(null);
          setSelectedFreeVendor(null);
        }}
      >
        {/* Existing mock vendors (with deals - colored pins) */}
        {vendors.map((vendor) => (
          <Marker
            key={vendor.id}
            coordinate={{ latitude: vendor.latitude, longitude: vendor.longitude }}
            onPress={() => handleMarkerPress(vendor)}
          >
            <View style={[
              styles.markerContainer,
              { backgroundColor: vendor.isOpen ? Colors.primary : theme.backgroundSecondary },
              selectedVendor?.id === vendor.id && styles.markerSelected,
            ]}>
              <Feather
                name="map-pin"
                size={16}
                color={vendor.isOpen ? "#fff" : theme.textSecondary}
              />
            </View>
          </Marker>
        ))}

        {/* Free tier vendor listings (neutral gray pins) */}
        {publicVendors.map((vendor) => (
          <Marker
            key={`free-${vendor.id}`}
            coordinate={{ latitude: vendor.locationLat, longitude: vendor.locationLng }}
            onPress={() => handleFreeVendorMarkerPress(vendor)}
          >
            <View style={[
              styles.freeVendorMarker,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              selectedFreeVendor?.id === vendor.id && styles.markerSelected,
            ]}>
              <Feather
                name="map-pin"
                size={16}
                color={theme.textSecondary}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.radiusSelector, { top: headerHeight + Spacing.lg }]}>
        {RADIUS_OPTIONS.map((radius, index) => (
          <Pressable
            key={radius}
            style={[
              styles.radiusButton,
              { backgroundColor: theme.backgroundDefault },
              radiusIndex === index && { backgroundColor: Colors.primary },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setRadiusIndex(index);
            }}
          >
            <ThemedText
              type="small"
              style={{ color: radiusIndex === index ? "#fff" : theme.text }}
            >
              {radius} mi
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.locationButton, { backgroundColor: theme.backgroundDefault, bottom: tabBarHeight + ((selectedVendor || selectedFreeVendor) ? 180 : Spacing.xl) }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (userLocation) {
            mapRef.current?.animateToRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            });
          }
        }}
      >
        <Feather name="navigation" size={20} color={Colors.primary} />
      </Pressable>

      {/* Selected vendor with deals (full info) */}
      {selectedVendor ? (
        <View style={[styles.vendorSheet, { paddingBottom: tabBarHeight + Spacing.lg }]}>
          <Card
            style={styles.vendorCard}
            onPress={() => navigation.navigate("VendorDetail", { vendorId: selectedVendor.id })}
          >
            <View style={styles.vendorCardContent}>
              <Image source={{ uri: selectedVendor.image }} style={styles.vendorImage} />
              <View style={styles.vendorInfo}>
                <View style={styles.vendorHeader}>
                  <ThemedText type="h4" numberOfLines={1} style={styles.vendorName}>
                    {selectedVendor.name}
                  </ThemedText>
                  {isFavorite(selectedVendor.id) ? (
                    <Feather name="heart" size={18} color={Colors.error} />
                  ) : null}
                </View>
                <View style={styles.vendorMeta}>
                  <Feather name="star" size={14} color={Colors.accent} />
                  <ThemedText type="small" style={styles.ratingText}>
                    {selectedVendor.rating} ({selectedVendor.reviewCount})
                  </ThemedText>
                  <ThemedText type="small" secondary> • {selectedVendor.cuisine}</ThemedText>
                </View>
                <View style={styles.dealsRow}>
                  <View style={[styles.dealsBadge, { backgroundColor: Colors.success + "20" }]}>
                    <ThemedText type="caption" style={{ color: Colors.success }}>
                      {getVendorDeals(selectedVendor.id).length} active deal{getVendorDeals(selectedVendor.id).length !== 1 ? "s" : ""}
                    </ThemedText>
                  </View>
                  {selectedVendor.isOpen ? (
                    <ThemedText type="caption" style={{ color: Colors.success }}>Open Now</ThemedText>
                  ) : (
                    <ThemedText type="caption" style={{ color: Colors.error }}>Closed</ThemedText>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </View>
          </Card>
        </View>
      ) : null}

      {/* Selected free vendor (simplified info) */}
      {selectedFreeVendor ? (
        <View style={[styles.vendorSheet, { paddingBottom: tabBarHeight + Spacing.lg }]}>
          <Card style={styles.vendorCard}>
            <View style={styles.freeVendorCardContent}>
              <View style={[styles.freeVendorIcon, { backgroundColor: theme.backgroundTertiary }]}>
                <Feather name="map-pin" size={24} color={theme.textSecondary} />
              </View>
              <View style={styles.vendorInfo}>
                <ThemedText type="h4" numberOfLines={1}>
                  {selectedFreeVendor.businessName}
                </ThemedText>
                <View style={styles.vendorMeta}>
                  <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundTertiary }]}>
                    <ThemedText type="caption" secondary>
                      {CATEGORY_LABELS[selectedFreeVendor.category] || selectedFreeVendor.category}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" secondary style={{ marginLeft: Spacing.sm }}>
                    Updated {formatLastUpdate(selectedFreeVendor.lastLocationUpdate)}
                  </ThemedText>
                </View>
                {selectedFreeVendor.description ? (
                  <ThemedText type="small" secondary numberOfLines={2} style={{ marginTop: Spacing.xs }}>
                    {selectedFreeVendor.description}
                  </ThemedText>
                ) : null}
                <Spacer size="sm" />
                <Pressable
                  style={[styles.directionsButton, { backgroundColor: Colors.primary }]}
                  onPress={() => openDirections(
                    selectedFreeVendor.locationLat,
                    selectedFreeVendor.locationLng,
                    selectedFreeVendor.businessName
                  )}
                >
                  <Feather name="navigation" size={14} color="#fff" />
                  <ThemedText type="small" style={{ color: "#fff", marginLeft: 6 }}>
                    Get Directions
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </Card>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.card,
  },
  freeVendorMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    ...Shadows.card,
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  radiusSelector: {
    position: "absolute",
    left: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  radiusButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.card,
  },
  locationButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.fab,
  },
  vendorSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  vendorCard: {
    padding: Spacing.md,
  },
  vendorCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vendorName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  vendorMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ratingText: {
    marginLeft: 4,
  },
  dealsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dealsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  vendorListWeb: {
    width: "100%",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  vendorCardWeb: {
    padding: Spacing.md,
  },
  freeVendorCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  freeVendorIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
});
