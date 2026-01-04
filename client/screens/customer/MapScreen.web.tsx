import React, { useEffect } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/lib/data-context";
import { useVendorListing } from "@/lib/vendor-listing-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { CustomerStackParamList } from "@/navigation/CustomerTabNavigator";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function MapScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { vendors } = useData();
  const { publicVendors, fetchPublicVendors } = useVendorListing();

  useEffect(() => {
    fetchPublicVendors();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="map" size={48} color={Colors.primary} />
          <Spacer size="lg" />
          <ThemedText type="h3" style={styles.title}>
            Map View
          </ThemedText>
          <ThemedText type="body" secondary style={styles.subtitle}>
            The interactive map is available in Expo Go on your mobile device. Scan the QR code to experience the full map features.
          </ThemedText>
        </View>

        <Spacer size="xl" />

        <ThemedText type="h4" style={styles.sectionTitle}>
          Nearby Vendors ({vendors.length + publicVendors.length})
        </ThemedText>
        <Spacer size="md" />

        <View style={styles.vendorList}>
          {vendors.map((vendor) => (
            <Card
              key={vendor.id}
              style={styles.vendorCard}
              onPress={() => navigation.navigate("VendorDetail", { vendorId: vendor.id })}
            >
              <View style={styles.vendorCardContent}>
                <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
                <View style={styles.vendorInfo}>
                  <ThemedText type="h4" numberOfLines={1}>{vendor.name}</ThemedText>
                  <ThemedText type="small" secondary>{vendor.cuisine}</ThemedText>
                  <View style={styles.statusRow}>
                    {vendor.isOpen ? (
                      <ThemedText type="caption" style={{ color: Colors.success }}>Open Now</ThemedText>
                    ) : (
                      <ThemedText type="caption" style={{ color: Colors.error }}>Closed</ThemedText>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Card>
          ))}

          {publicVendors.map((vendor) => (
            <Card key={`free-${vendor.id}`} style={styles.vendorCard}>
              <View style={styles.vendorCardContent}>
                <View style={[styles.vendorIconPlaceholder, { backgroundColor: theme.backgroundTertiary }]}>
                  <Feather name="map-pin" size={24} color={theme.textSecondary} />
                </View>
                <View style={styles.vendorInfo}>
                  <ThemedText type="h4" numberOfLines={1}>{vendor.businessName}</ThemedText>
                  <ThemedText type="small" secondary>{vendor.category}</ThemedText>
                  {vendor.description ? (
                    <ThemedText type="caption" secondary numberOfLines={1}>{vendor.description}</ThemedText>
                  ) : null}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
  infoCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  vendorList: {
    gap: Spacing.md,
  },
  vendorCard: {
    padding: Spacing.md,
  },
  vendorCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
  },
  vendorIconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  vendorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusRow: {
    marginTop: Spacing.xs,
  },
});
