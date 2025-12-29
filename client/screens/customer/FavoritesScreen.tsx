import React from "react";
import { View, StyleSheet, FlatList, Pressable, Image, Switch } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { CustomerStackParamList } from "@/navigation/CustomerTabNavigator";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { vendors, deals, favorites, toggleNotifyNearby, removeFavorite } = useData();

  const favoriteVendors = favorites.map((fav) => {
    const vendor = vendors.find((v) => v.id === fav.vendorId);
    const vendorDeals = deals.filter((d) => d.vendorId === fav.vendorId);
    return { ...fav, vendor, dealCount: vendorDeals.length };
  }).filter((f) => f.vendor);

  const renderFavoriteItem = ({ item }: { item: typeof favoriteVendors[0] }) => {
    if (!item.vendor) return null;

    return (
      <Card
        style={styles.favoriteCard}
        onPress={() => navigation.navigate("VendorDetail", { vendorId: item.vendor!.id })}
      >
        <View style={styles.cardContent}>
          <Image source={{ uri: item.vendor.image }} style={styles.vendorImage} />
          <View style={styles.vendorInfo}>
            <ThemedText type="h4" numberOfLines={1}>{item.vendor.name}</ThemedText>
            <View style={styles.metaRow}>
              <Feather name="star" size={14} color={Colors.accent} />
              <ThemedText type="small" style={styles.ratingText}>
                {item.vendor.rating}
              </ThemedText>
              <ThemedText type="small" secondary> • {item.vendor.cuisine}</ThemedText>
            </View>
            <View style={styles.statusRow}>
              {item.vendor.isOpen ? (
                <View style={[styles.statusBadge, { backgroundColor: Colors.success + "20" }]}>
                  <ThemedText type="caption" style={{ color: Colors.success }}>Open</ThemedText>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: Colors.error + "20" }]}>
                  <ThemedText type="caption" style={{ color: Colors.error }}>Closed</ThemedText>
                </View>
              )}
              {item.dealCount > 0 ? (
                <View style={[styles.dealBadge, { backgroundColor: Colors.primary + "20" }]}>
                  <ThemedText type="caption" style={{ color: Colors.primary }}>
                    {item.dealCount} deal{item.dealCount !== 1 ? "s" : ""}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removeFavorite(item.vendorId);
            }}
            hitSlop={8}
            style={styles.removeButton}
          >
            <Feather name="heart" size={22} color={Colors.error} />
          </Pressable>
        </View>

        <View style={[styles.notifyRow, { borderTopColor: theme.border }]}>
          <View style={styles.notifyContent}>
            <Feather name="bell" size={18} color={theme.textSecondary} />
            <ThemedText type="small" style={styles.notifyText}>Notify when nearby</ThemedText>
          </View>
          <Switch
            value={item.notifyWhenNearby}
            onValueChange={() => {
              Haptics.selectionAsync();
              toggleNotifyNearby(item.vendorId);
            }}
            trackColor={{ false: theme.backgroundTertiary, true: Colors.primary + "60" }}
            thumbColor={item.notifyWhenNearby ? Colors.primary : theme.backgroundSecondary}
          />
        </View>
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={favoriteVendors}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.vendorId}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <Spacer size="md" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.error + "15" }]}>
              <Feather name="heart" size={40} color={Colors.error} />
            </View>
            <Spacer size="lg" />
            <ThemedText type="h4">No favorites yet</ThemedText>
            <ThemedText type="body" secondary style={styles.emptyText}>
              Follow your favorite vendors to see them here and get notified when they're nearby
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
  favoriteCard: {
    padding: 0,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ratingText: {
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  dealBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  notifyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  notifyContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifyText: {
    marginLeft: Spacing.sm,
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
});
