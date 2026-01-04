import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { Card } from "@/components/Card";
import { ProductPhotoCapture, ProductPhoto } from "@/components/ProductPhotoCapture";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  useVendorListing,
  VendorCategory,
  CreateListingData,
} from "@/lib/vendor-listing-context";
import { MAJOR_CITIES } from "@/lib/data-context";

const CATEGORIES: { value: VendorCategory; label: string; icon: string }[] = [
  { value: "food_truck", label: "Food Truck", icon: "truck" },
  { value: "restaurant", label: "Restaurant", icon: "home" },
  { value: "vendor", label: "Vendor/Cart", icon: "shopping-bag" },
];

export default function MyListingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const {
    myListing,
    hasListing,
    canUpdateLocation,
    locationUpdateWaitMinutes,
    tierLimits,
    isLoadingMyListing,
    isSaving,
    error,
    createListing,
    updateListing,
    updateLocation,
    updateProductPhotos,
    deleteListing,
    refreshMyListing,
  } = useVendorListing();

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("food_truck");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productPhotos, setProductPhotos] = useState<ProductPhoto[]>([]);

  // Load existing listing data into form
  useEffect(() => {
    if (myListing) {
      setBusinessName(myListing.businessName);
      setCategory(myListing.category);
      setDescription(myListing.description || "");
      setPhone(myListing.phone || "");
      setCity(myListing.city);
      setState(myListing.state);
      setLocationLat(myListing.locationLat);
      setLocationLng(myListing.locationLng);
      setProductPhotos(myListing.productPhotos || []);
    }
  }, [myListing]);

  // Handle photo changes
  const handlePhotosChange = async (photos: ProductPhoto[]) => {
    setProductPhotos(photos);
    // If we have an existing listing, save photos immediately
    if (hasListing && myListing) {
      await updateProductPhotos(photos);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to set your location.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocationLat(location.coords.latitude);
      setLocationLng(location.coords.longitude);

      // Try to find the city from our list
      const nearestCity = findNearestCity(location.coords.latitude, location.coords.longitude);
      if (nearestCity) {
        setCity(nearestCity.city);
        setState(nearestCity.state);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to get your location. Please try again.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const findNearestCity = (lat: number, lng: number) => {
    let nearest = MAJOR_CITIES[0];
    let minDistance = Infinity;

    for (const cityData of MAJOR_CITIES) {
      const distance = Math.sqrt(
        Math.pow(cityData.latitude - lat, 2) + Math.pow(cityData.longitude - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = cityData;
      }
    }

    return nearest;
  };

  const handleCreateListing = async () => {
    if (!businessName.trim()) {
      Alert.alert("Required", "Please enter your business name");
      return;
    }
    if (!city.trim() || !state.trim()) {
      Alert.alert("Required", "Please enter your city and state");
      return;
    }
    if (locationLat === null || locationLng === null) {
      Alert.alert("Required", "Please set your location");
      return;
    }

    const data: CreateListingData = {
      businessName: businessName.trim(),
      category,
      description: description.trim() || undefined,
      phone: phone.trim() || undefined,
      locationLat,
      locationLng,
      city: city.trim(),
      state: state.trim(),
      productPhotos: productPhotos.length > 0 ? productPhotos : undefined,
    };

    const success = await createListing(data);
    if (success) {
      Alert.alert("Success", "Your listing has been created!");
    }
  };

  const handleUpdateListing = async () => {
    if (!businessName.trim()) {
      Alert.alert("Required", "Please enter your business name");
      return;
    }

    const success = await updateListing({
      businessName: businessName.trim(),
      category,
      description: description.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    if (success) {
      setIsEditing(false);
      Alert.alert("Success", "Your listing has been updated!");
    }
  };

  const handleUpdateLocation = async () => {
    if (!canUpdateLocation) {
      Alert.alert(
        "Rate Limited",
        `Free tier allows 1 location update per hour. Please wait ${locationUpdateWaitMinutes} minutes.`
      );
      return;
    }

    if (locationLat === null || locationLng === null) {
      Alert.alert("Required", "Please set your location first");
      return;
    }

    const success = await updateLocation({
      locationLat,
      locationLng,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
    });

    if (success) {
      Alert.alert("Success", "Your location has been updated!");
    }
  };

  const handleDeleteListing = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete your listing? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteListing();
            if (success) {
              setBusinessName("");
              setDescription("");
              setPhone("");
              setCity("");
              setState("");
              setLocationLat(null);
              setLocationLng(null);
              setProductPhotos([]);
              Alert.alert("Deleted", "Your listing has been removed.");
            }
          },
        },
      ]
    );
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoadingMyListing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Spacer size="md" />
        <ThemedText type="body" secondary>
          Loading your listing...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Free Tier Banner */}
        <Card style={[styles.tierBanner, { backgroundColor: Colors.primary + "15" }]}>
          <View style={styles.tierBannerContent}>
            <View style={[styles.tierBadge, { backgroundColor: Colors.primary }]}>
              <ThemedText type="caption" style={styles.tierBadgeText}>
                FREE
              </ThemedText>
            </View>
            <View style={styles.tierInfo}>
              <ThemedText type="h4">Listed & Discovery Tier</ThemedText>
              <ThemedText type="small" secondary>
                Your business appears on the map for customer discovery
              </ThemedText>
            </View>
          </View>
          <Spacer size="sm" />
          <View style={styles.tierLimits}>
            <View style={styles.limitItem}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.limitText}>
                Static location (manual updates only)
              </ThemedText>
            </View>
            <View style={styles.limitItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.limitText}>
                1 location update per hour
              </ThemedText>
            </View>
            <View style={styles.limitItem}>
              <Feather name="eye" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.limitText}>
                Standard map pin (no promotion)
              </ThemedText>
            </View>
          </View>
        </Card>

        <Spacer size="xl" />

        {/* Error Display */}
        {error && (
          <>
            <Card style={[styles.errorCard, { backgroundColor: Colors.error + "15" }]}>
              <Feather name="alert-circle" size={20} color={Colors.error} />
              <ThemedText type="small" style={{ color: Colors.error, marginLeft: Spacing.sm, flex: 1 }}>
                {error}
              </ThemedText>
            </Card>
            <Spacer size="md" />
          </>
        )}

        {/* Existing Listing View */}
        {hasListing && myListing && !isEditing ? (
          <>
            <Card style={styles.listingCard}>
              <View style={styles.listingHeader}>
                <ThemedText type="h3">{myListing.businessName}</ThemedText>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  style={[styles.editButton, { backgroundColor: theme.backgroundTertiary }]}
                >
                  <Feather name="edit-2" size={16} color={Colors.primary} />
                </Pressable>
              </View>

              <Spacer size="sm" />

              <View style={styles.categoryBadge}>
                <Feather
                  name={CATEGORIES.find((c) => c.value === myListing.category)?.icon as any || "tag"}
                  size={14}
                  color={Colors.primary}
                />
                <ThemedText type="small" style={{ color: Colors.primary, marginLeft: 4 }}>
                  {CATEGORIES.find((c) => c.value === myListing.category)?.label}
                </ThemedText>
              </View>

              {myListing.description && (
                <>
                  <Spacer size="md" />
                  <ThemedText type="body" secondary>
                    {myListing.description}
                  </ThemedText>
                </>
              )}

              <Spacer size="xl" />

              {/* Product Photos Section */}
              <ProductPhotoCapture
                photos={productPhotos}
                onPhotosChange={handlePhotosChange}
                maxPhotos={6}
                title="Product Photos"
                subtitle="Showcase your best dishes and products"
              />

              <Spacer size="lg" />

              <View style={styles.infoRow}>
                <Feather name="map-pin" size={16} color={theme.textSecondary} />
                <ThemedText type="body" style={styles.infoText}>
                  {myListing.city}, {myListing.state}
                </ThemedText>
              </View>

              {myListing.phone && (
                <View style={styles.infoRow}>
                  <Feather name="phone" size={16} color={theme.textSecondary} />
                  <ThemedText type="body" style={styles.infoText}>
                    {myListing.phone}
                  </ThemedText>
                </View>
              )}

              <View style={styles.infoRow}>
                <Feather name="clock" size={16} color={theme.textSecondary} />
                <ThemedText type="small" secondary style={styles.infoText}>
                  Location updated: {formatLastUpdate(myListing.lastLocationUpdate)}
                </ThemedText>
              </View>
            </Card>

            <Spacer size="lg" />

            {/* Location Update Section */}
            <Card style={styles.locationCard}>
              <ThemedText type="h4">Update Location</ThemedText>
              <Spacer size="sm" />
              <ThemedText type="small" secondary>
                Manually update your location when you move to a new spot.
              </ThemedText>

              <Spacer size="md" />

              <View style={styles.coordsDisplay}>
                <ThemedText type="caption" secondary>
                  Current: {locationLat?.toFixed(4)}, {locationLng?.toFixed(4)}
                </ThemedText>
              </View>

              <Spacer size="md" />

              <Pressable
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
                style={[styles.outlineButton, { borderColor: Colors.primary }]}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Feather name="crosshair" size={16} color={Colors.primary} />
                    <ThemedText type="body" style={{ color: Colors.primary, marginLeft: 8 }}>
                      Get Current Location
                    </ThemedText>
                  </>
                )}
              </Pressable>

              <Spacer size="sm" />

              <Button
                onPress={handleUpdateLocation}
                disabled={isSaving || !canUpdateLocation}
                style={styles.locationButton}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : canUpdateLocation ? (
                  "Save New Location"
                ) : (
                  `Wait ${locationUpdateWaitMinutes} min`
                )}
              </Button>

              {!canUpdateLocation && (
                <>
                  <Spacer size="sm" />
                  <ThemedText type="caption" secondary style={styles.rateLimitNote}>
                    Free tier: 1 location update per hour
                  </ThemedText>
                </>
              )}
            </Card>

            <Spacer size="xl" />

            {/* Delete Listing */}
            <Pressable onPress={handleDeleteListing} style={styles.deleteButton}>
              <Feather name="trash-2" size={16} color={Colors.error} />
              <ThemedText type="body" style={{ color: Colors.error, marginLeft: 8 }}>
                Delete Listing
              </ThemedText>
            </Pressable>
          </>
        ) : (
          /* Create/Edit Listing Form */
          <>
            <ThemedText type="h2">
              {isEditing ? "Edit Your Listing" : "Create Your Listing"}
            </ThemedText>
            <Spacer size="sm" />
            <ThemedText type="body" secondary>
              {isEditing
                ? "Update your business information"
                : "Set up your free listing to appear on the map"}
            </ThemedText>

            <Spacer size="xl" />

            {/* Business Name */}
            <ThemedText type="caption" secondary style={styles.label}>
              BUSINESS NAME *
            </ThemedText>
            <Spacer size="xs" />
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
              ]}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter your business name"
              placeholderTextColor={theme.textSecondary}
            />

            <Spacer size="lg" />

            {/* Category */}
            <ThemedText type="caption" secondary style={styles.label}>
              CATEGORY *
            </ThemedText>
            <Spacer size="xs" />
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: category === cat.value ? Colors.primary + "20" : theme.backgroundDefault,
                      borderColor: category === cat.value ? Colors.primary : theme.border,
                    },
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Feather
                    name={cat.icon as any}
                    size={20}
                    color={category === cat.value ? Colors.primary : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      marginTop: 4,
                      color: category === cat.value ? Colors.primary : theme.text,
                    }}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer size="lg" />

            {/* Description */}
            <ThemedText type="caption" secondary style={styles.label}>
              DESCRIPTION
            </ThemedText>
            <Spacer size="xs" />
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your business (optional)"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />

            <Spacer size="xl" />

            {/* Product Photos */}
            <ProductPhotoCapture
              photos={productPhotos}
              onPhotosChange={setProductPhotos}
              maxPhotos={6}
              title="Product Photos"
              subtitle="Add photos to attract more customers"
            />

            <Spacer size="lg" />

            {/* Phone */}
            <ThemedText type="caption" secondary style={styles.label}>
              PHONE NUMBER
            </ThemedText>
            <Spacer size="xs" />
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 555-5555"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />

            {!isEditing && (
              <>
                <Spacer size="lg" />

                {/* Location */}
                <ThemedText type="caption" secondary style={styles.label}>
                  LOCATION *
                </ThemedText>
                <Spacer size="xs" />

                <Pressable
                  onPress={getCurrentLocation}
                  disabled={isGettingLocation}
                  style={[styles.outlineButton, { borderColor: Colors.primary }]}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Feather name="crosshair" size={16} color={Colors.primary} />
                      <ThemedText type="body" style={{ color: Colors.primary, marginLeft: 8 }}>
                        {locationLat ? "Update Location" : "Get Current Location"}
                      </ThemedText>
                    </>
                  )}
                </Pressable>

                {locationLat && locationLng && (
                  <>
                    <Spacer size="sm" />
                    <View style={styles.coordsDisplay}>
                      <Feather name="check-circle" size={14} color={Colors.success} />
                      <ThemedText type="small" style={{ marginLeft: 6, color: Colors.success }}>
                        Location set: {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
                      </ThemedText>
                    </View>
                  </>
                )}

                <Spacer size="lg" />

                {/* City & State */}
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <ThemedText type="caption" secondary style={styles.label}>
                      CITY *
                    </ThemedText>
                    <Spacer size="xs" />
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                      ]}
                      value={city}
                      onChangeText={setCity}
                      placeholder="City"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ThemedText type="caption" secondary style={styles.label}>
                      STATE *
                    </ThemedText>
                    <Spacer size="xs" />
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                      ]}
                      value={state}
                      onChangeText={setState}
                      placeholder="FL"
                      placeholderTextColor={theme.textSecondary}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </>
            )}

            <Spacer size="2xl" />

            {/* Submit Button */}
            <Button
              onPress={isEditing ? handleUpdateListing : handleCreateListing}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Listing"
              )}
            </Button>

            {isEditing && (
              <>
                <Spacer size="md" />
                <Pressable onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    Cancel
                  </ThemedText>
                </Pressable>
              </>
            )}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  tierBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  tierBannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  tierBadgeText: {
    color: "#fff",
    fontWeight: "700",
  },
  tierInfo: {
    flex: 1,
  },
  tierLimits: {
    gap: Spacing.xs,
  },
  limitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  limitText: {
    marginLeft: Spacing.sm,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  listingCard: {
    padding: Spacing.lg,
  },
  listingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + "15",
    borderRadius: BorderRadius.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  infoText: {
    marginLeft: Spacing.sm,
  },
  locationCard: {
    padding: Spacing.lg,
  },
  coordsDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  rateLimitNote: {
    textAlign: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  label: {
    letterSpacing: 1,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  categoryOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  cancelButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
});
