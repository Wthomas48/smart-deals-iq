import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, Modal, ScrollView, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useData, CustomerRecord } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

type FilterType = "all" | "top" | "atrisk" | "new";

export default function CustomersScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { customers, analytics } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "users" },
    { key: "top", label: "Top Spenders", icon: "award" },
    { key: "atrisk", label: "At Risk", icon: "alert-triangle" },
    { key: "new", label: "New", icon: "user-plus" },
  ];

  // Customer analytics
  const customerStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const repeatRate = totalCustomers > 0
      ? (customers.filter(c => c.visitCount > 1).length / totalCustomers) * 100
      : 0;
    return { totalCustomers, totalRevenue, avgSpend, repeatRate };
  }, [customers]);

  const getFilteredCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (activeFilter) {
      case "top":
        return [...filtered].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
      case "atrisk":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return filtered.filter((c) => new Date(c.lastVisit) < thirtyDaysAgo);
      case "new":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return filtered.filter((c) => c.visitCount <= 2);
      default:
        return filtered;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCustomerPress = (customer: CustomerRecord) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleSendOffer = (customer: CustomerRecord) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedCustomer(customer);
    setShowSendOfferModal(true);
  };

  const renderAnalyticsHeader = () => (
    <View style={styles.analyticsContainer}>
      <Card style={styles.analyticsCard}>
        <ThemedText type="h4">Customer Insights</ThemedText>
        <Spacer size="md" />
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + "20" }]}>
              <Feather name="users" size={18} color={Colors.primary} />
            </View>
            <ThemedText type="h3">{customerStats.totalCustomers}</ThemedText>
            <ThemedText type="caption" secondary>Total</ThemedText>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + "20" }]}>
              <Feather name="dollar-sign" size={18} color={Colors.success} />
            </View>
            <ThemedText type="h3">${customerStats.totalRevenue.toFixed(0)}</ThemedText>
            <ThemedText type="caption" secondary>Revenue</ThemedText>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accent + "20" }]}>
              <Feather name="trending-up" size={18} color={Colors.accent} />
            </View>
            <ThemedText type="h3">${customerStats.avgSpend.toFixed(0)}</ThemedText>
            <ThemedText type="caption" secondary>Avg Spend</ThemedText>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondary + "20" }]}>
              <Feather name="repeat" size={18} color={Colors.secondary} />
            </View>
            <ThemedText type="h3">{customerStats.repeatRate.toFixed(0)}%</ThemedText>
            <ThemedText type="caption" secondary>Repeat</ThemedText>
          </View>
        </View>
      </Card>
      <Spacer size="md" />
    </View>
  );

  const renderCustomer = ({ item }: { item: CustomerRecord }) => {
    const isTopSpender = customers.sort((a, b) => b.totalSpent - a.totalSpent).indexOf(item) < 3;
    const isAtRisk = (() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(item.lastVisit) < thirtyDaysAgo;
    })();

    return (
    <Pressable onPress={() => handleCustomerPress(item)}>
      <Card style={styles.customerCard}>
        <View style={styles.customerContent}>
          <View style={[styles.avatar, { backgroundColor: Colors.secondary + "30" }]}>
            <ThemedText type="body" style={{ color: Colors.secondary, fontWeight: "600" }}>
              {getInitials(item.name)}
            </ThemedText>
            {isTopSpender && (
              <View style={styles.topBadge}>
                <Feather name="award" size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.customerInfo}>
            <View style={styles.customerNameRow}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>{item.name}</ThemedText>
              {isAtRisk && (
                <View style={[styles.atRiskBadge, { backgroundColor: Colors.error + "20" }]}>
                  <ThemedText type="caption" style={{ color: Colors.error }}>At Risk</ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="small" secondary>{item.email}</ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Feather name="repeat" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" secondary style={styles.statText}>
                  {item.visitCount} visits
                </ThemedText>
              </View>
              <View style={styles.stat}>
                <Feather name="dollar-sign" size={12} color={Colors.success} />
                <ThemedText type="caption" style={{ ...styles.statText, color: Colors.success }}>
                  ${item.totalSpent.toFixed(0)}
                </ThemedText>
              </View>
              <View style={styles.stat}>
                <Feather name="clock" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" secondary style={styles.statText}>
                  {formatDate(item.lastVisit)}
                </ThemedText>
              </View>
            </View>
          </View>
          <Pressable
            style={[styles.sendOfferButton, { backgroundColor: Colors.primary + "15" }]}
            onPress={(e) => {
              e.stopPropagation();
              handleSendOffer(item);
            }}
          >
            <Feather name="send" size={16} color={Colors.primary} />
          </Pressable>
        </View>
      </Card>
    </Pressable>
    );
  };

  const filteredCustomers = getFilteredCustomers();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search customers..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterChip,
                { backgroundColor: activeFilter === filter.key ? Colors.primary : theme.backgroundDefault },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                setActiveFilter(filter.key);
              }}
            >
              <Feather
                name={filter.icon as any}
                size={14}
                color={activeFilter === filter.key ? "#fff" : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={{ color: activeFilter === filter.key ? "#fff" : theme.text, marginLeft: 4 }}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <Spacer size="sm" />}
        ListHeaderComponent={
          <>
            {renderAnalyticsHeader()}
            <View style={styles.listHeader}>
              <ThemedText type="small" secondary>
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={40} color={theme.textSecondary} />
            <Spacer size="lg" />
            <ThemedText type="h4">No customers found</ThemedText>
            <ThemedText type="body" secondary style={styles.emptyText}>
              {searchQuery ? "Try adjusting your search" : "Customers will appear here as they make purchases"}
            </ThemedText>
          </View>
        }
      />

      {/* Send Offer Modal */}
      <Modal visible={showSendOfferModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowSendOfferModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Send Offer</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <Spacer size="2xl" />

            {selectedCustomer && (
              <>
                <View style={styles.selectedCustomerCard}>
                  <View style={[styles.avatar, { backgroundColor: Colors.secondary + "30" }]}>
                    <ThemedText type="body" style={{ color: Colors.secondary, fontWeight: "600" }}>
                      {getInitials(selectedCustomer.name)}
                    </ThemedText>
                  </View>
                  <View style={styles.customerInfo}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>{selectedCustomer.name}</ThemedText>
                    <ThemedText type="small" secondary>{selectedCustomer.email}</ThemedText>
                  </View>
                </View>

                <Spacer size="xl" />

                <ThemedText type="h4">Quick Offers</ThemedText>
                <Spacer size="md" />

                {[
                  { title: "10% Off Next Visit", desc: "One-time discount", icon: "percent" },
                  { title: "Free Item", desc: "Add a free item to order", icon: "gift" },
                  { title: "Loyalty Bonus", desc: "Double points on next purchase", icon: "star" },
                  { title: "Custom Offer", desc: "Create a personalized deal", icon: "edit-3" },
                ].map((offer, index) => (
                  <Pressable
                    key={index}
                    style={[styles.offerOption, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                      setShowSendOfferModal(false);
                    }}
                  >
                    <View style={[styles.offerIcon, { backgroundColor: Colors.primary + "20" }]}>
                      <Feather name={offer.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.offerInfo}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>{offer.title}</ThemedText>
                      <ThemedText type="caption" secondary>{offer.desc}</ThemedText>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filtersContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  analyticsContainer: {},
  analyticsCard: {},
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  topBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  customerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  atRiskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  customerCard: {
    padding: 0,
  },
  customerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  customerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 4,
  },
  sendOfferButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedCustomerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.primary + "10",
    borderRadius: BorderRadius.lg,
  },
  offerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  offerInfo: {
    flex: 1,
  },
});
