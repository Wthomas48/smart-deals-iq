import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  SectionList,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Card } from "./Card";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData, MAJOR_CITIES, CityLocation } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

// State abbreviation to full name mapping
const STATE_NAMES: Record<string, string> = {
  FL: "Florida",
  CA: "California",
  TX: "Texas",
  NY: "New York",
  IL: "Illinois",
  WA: "Washington",
  CO: "Colorado",
  MA: "Massachusetts",
  GA: "Georgia",
  AZ: "Arizona",
  NV: "Nevada",
  OR: "Oregon",
  MI: "Michigan",
  MN: "Minnesota",
  PA: "Pennsylvania",
  NC: "North Carolina",
  TN: "Tennessee",
  LA: "Louisiana",
  MO: "Missouri",
  IN: "Indiana",
  OH: "Ohio",
  MD: "Maryland",
  DC: "Washington DC",
  UT: "Utah",
  HI: "Hawaii",
  AK: "Alaska",
};

interface LocationSearchProps {
  compact?: boolean;
}

// Popular states to highlight
const FEATURED_STATES = ["FL", "CA", "TX", "NY"];

export function LocationSearch({ compact = false }: LocationSearchProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { searchLocation, setSearchLocation, searchByZipCode, getFilteredVendors } = useData();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredCities = useMemo(() => {
    let cities = MAJOR_CITIES;

    // Filter by selected state first
    if (selectedState) {
      cities = cities.filter((city) => city.state === selectedState);
    }

    // Then filter by search query
    if (searchQuery) {
      cities = cities.filter(
        (city) =>
          city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.zipCode.includes(searchQuery) ||
          city.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (STATE_NAMES[city.state] &&
            STATE_NAMES[city.state].toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return cities;
  }, [searchQuery, selectedState]);

  // Get unique states and their city counts
  const stateStats = useMemo(() => {
    const stats: Record<string, number> = {};
    MAJOR_CITIES.forEach((city) => {
      stats[city.state] = (stats[city.state] || 0) + 1;
    });
    return stats;
  }, []);

  const handleSelectCity = (city: CityLocation) => {
    setSearchLocation(city);
    setShowModal(false);
    setSearchQuery("");
    setSelectedState(null);
  };

  const handleClear = () => {
    setSearchLocation(null);
    setSearchQuery("");
    setSelectedState(null);
  };

  const handleStateSelect = (state: string) => {
    if (selectedState === state) {
      setSelectedState(null);
    } else {
      setSelectedState(state);
      setSearchQuery("");
    }
  };

  const handleZipSearch = () => {
    if (searchQuery.length === 5 && /^\d+$/.test(searchQuery)) {
      const result = searchByZipCode(searchQuery);
      if (result) {
        setShowModal(false);
        setSearchQuery("");
      }
    }
  };

  if (compact) {
    return (
      <Pressable
        style={[styles.compactButton, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => setShowModal(true)}
      >
        <Feather name="map-pin" size={16} color={Colors.primary} />
        <ThemedText type="small" style={{ marginLeft: Spacing.xs, flex: 1 }} numberOfLines={1}>
          {searchLocation ? `${searchLocation.city}, ${searchLocation.state}` : "All Locations"}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>
    );
  }

  return (
    <>
      <Card style={styles.searchCard}>
        <Pressable
          style={[styles.searchBar, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => setShowModal(true)}
        >
          <Feather name="map-pin" size={20} color={Colors.primary} />
          <View style={styles.searchTextContainer}>
            <ThemedText type="small" secondary>
              Find deals in
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {searchLocation
                ? `${searchLocation.city}, ${searchLocation.state}`
                : "Any City or Zip Code"}
            </ThemedText>
          </View>
          {searchLocation ? (
            <Pressable onPress={handleClear} hitSlop={8}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : (
            <View style={[styles.searchIcon, { backgroundColor: Colors.primary }]}>
              <Feather name="search" size={16} color="#fff" />
            </View>
          )}
        </Pressable>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="map" size={14} color={Colors.secondary} />
            <ThemedText type="caption" secondary style={{ marginLeft: 4 }}>
              {MAJOR_CITIES.length} cities
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="shopping-bag" size={14} color={Colors.primary} />
            <ThemedText type="caption" secondary style={{ marginLeft: 4 }}>
              {getFilteredVendors().length} vendors
            </ThemedText>
          </View>
        </View>
      </Card>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Find Deals Near You</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <Spacer size="xl" />

            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter city name or zip code..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleZipSearch}
                keyboardType="default"
                autoFocus
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <Spacer size="lg" />

            {searchLocation && (
              <>
                <Pressable
                  style={[styles.clearLocationButton, { backgroundColor: Colors.error + "15" }]}
                  onPress={handleClear}
                >
                  <Feather name="x-circle" size={18} color={Colors.error} />
                  <ThemedText type="body" style={{ color: Colors.error, marginLeft: Spacing.sm }}>
                    Clear location filter
                  </ThemedText>
                </Pressable>
                <Spacer size="md" />
              </>
            )}

            {/* Featured State Quick Select */}
            <ThemedText type="small" secondary style={styles.sectionLabel}>
              BROWSE BY STATE
            </ThemedText>
            <Spacer size="sm" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateScroll}>
              <View style={styles.stateChipsRow}>
                {FEATURED_STATES.map((state) => (
                  <Pressable
                    key={state}
                    style={[
                      styles.stateChip,
                      { backgroundColor: theme.backgroundSecondary },
                      selectedState === state && {
                        backgroundColor: Colors.primary,
                      },
                    ]}
                    onPress={() => handleStateSelect(state)}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        fontWeight: "600",
                        color: selectedState === state ? "#fff" : theme.text,
                      }}
                    >
                      {STATE_NAMES[state]}
                    </ThemedText>
                    <View
                      style={[
                        styles.stateCount,
                        {
                          backgroundColor: selectedState === state ? "rgba(255,255,255,0.3)" : Colors.primary + "20",
                        },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{
                          color: selectedState === state ? "#fff" : Colors.primary,
                          fontWeight: "700",
                        }}
                      >
                        {stateStats[state] || 0}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
                {/* All States option */}
                {Object.keys(stateStats)
                  .filter((s) => !FEATURED_STATES.includes(s))
                  .sort()
                  .map((state) => (
                    <Pressable
                      key={state}
                      style={[
                        styles.stateChipSmall,
                        { backgroundColor: theme.backgroundSecondary },
                        selectedState === state && {
                          backgroundColor: Colors.secondary,
                        },
                      ]}
                      onPress={() => handleStateSelect(state)}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: selectedState === state ? "#fff" : theme.text,
                        }}
                      >
                        {state}
                      </ThemedText>
                    </Pressable>
                  ))}
              </View>
            </ScrollView>

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.sectionLabel}>
              {selectedState
                ? `${STATE_NAMES[selectedState] || selectedState} CITIES (${filteredCities.length})`
                : searchQuery
                ? `SEARCH RESULTS (${filteredCities.length})`
                : `ALL ${MAJOR_CITIES.length} CITIES`}
            </ThemedText>
            <Spacer size="sm" />

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.zipCode}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.cityItem,
                    { backgroundColor: theme.backgroundSecondary },
                    searchLocation?.zipCode === item.zipCode && {
                      backgroundColor: Colors.primary + "15",
                      borderColor: Colors.primary,
                    },
                  ]}
                  onPress={() => handleSelectCity(item)}
                >
                  <View style={[styles.cityIcon, { backgroundColor: Colors.primary + "20" }]}>
                    <Feather name="map-pin" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.cityInfo}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {item.city}
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      {item.state} • {item.zipCode}
                    </ThemedText>
                  </View>
                  {searchLocation?.zipCode === item.zipCode && (
                    <Feather name="check-circle" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <Spacer size="sm" />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="map" size={40} color={theme.textSecondary} />
                  <Spacer size="md" />
                  <ThemedText type="body" secondary>
                    No cities match your search
                  </ThemedText>
                </View>
              }
            />
          </View>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    marginHorizontal: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  searchTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  clearLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  sectionLabel: {
    letterSpacing: 1,
    fontWeight: "600",
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cityInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  stateScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  stateChipsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  stateChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  stateChipSmall: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  stateCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
});
