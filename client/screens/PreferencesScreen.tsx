import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import Slider from "@react-native-community/slider";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences } from "@/lib/preferences-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import type { ThemeMode } from "@/lib/theme-context";

type PreferencesTab = "notifications" | "location" | "appearance";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "smartphone" },
];

const RADIUS_OPTIONS = [5, 10, 15, 25, 50];

export default function PreferencesScreen() {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { notifications, location, updateNotifications, updateLocation } = usePreferences();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [activeTab, setActiveTab] = useState<PreferencesTab>("notifications");

  const handleNotificationToggle = async (key: keyof typeof notifications, value: boolean) => {
    await updateNotifications({ [key]: value });
  };

  const handleLocationToggle = async (key: keyof typeof location, value: boolean) => {
    await updateLocation({ [key]: value });
  };

  const handleRadiusChange = async (radius: number) => {
    await updateLocation({ searchRadius: radius });
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const renderTab = (tab: PreferencesTab, icon: string, label: string) => (
    <Pressable
      style={[
        styles.tab,
        activeTab === tab && { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Feather
        name={icon as any}
        size={20}
        color={activeTab === tab ? Colors.primary : theme.textSecondary}
      />
      <ThemedText
        type="small"
        style={[
          styles.tabLabel,
          activeTab === tab && { color: Colors.primary, fontWeight: "600" },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderSwitch = (
    label: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    icon: string
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: Colors.primary + "15" }]}>
        <Feather name={icon as any} size={18} color={Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="body">{label}</ThemedText>
        <ThemedText type="caption" secondary style={styles.settingDescription}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: Colors.primary + "60" }}
        thumbColor={value ? Colors.primary : theme.backgroundTertiary}
        ios_backgroundColor={theme.border}
      />
    </View>
  );

  const renderNotificationsContent = () => (
    <View>
      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        PUSH NOTIFICATIONS
      </ThemedText>
      <Card style={styles.card}>
        {renderSwitch(
          "Enable Notifications",
          "Receive push notifications on your device",
          notifications.pushEnabled,
          (v) => handleNotificationToggle("pushEnabled", v),
          "bell"
        )}
        {renderSwitch(
          "Deal Alerts",
          "Get notified about deals from saved stores",
          notifications.dealAlerts,
          (v) => handleNotificationToggle("dealAlerts", v),
          "tag"
        )}
        {renderSwitch(
          "Flash Deals",
          "Instant alerts for time-limited offers",
          notifications.flashDeals,
          (v) => handleNotificationToggle("flashDeals", v),
          "zap"
        )}
        {renderSwitch(
          "Price Drops",
          "Alerts when prices drop on saved items",
          notifications.priceDrops,
          (v) => handleNotificationToggle("priceDrops", v),
          "trending-down"
        )}
        {renderSwitch(
          "New Stores Nearby",
          "Discover new stores in your area",
          notifications.newStores,
          (v) => handleNotificationToggle("newStores", v),
          "map-pin"
        )}
      </Card>

      <Spacer size="xl" />

      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        EMAIL NOTIFICATIONS
      </ThemedText>
      <Card style={styles.card}>
        {renderSwitch(
          "Weekly Digest",
          "Summary of best deals every week",
          notifications.weeklyDigest,
          (v) => handleNotificationToggle("weeklyDigest", v),
          "mail"
        )}
      </Card>

      <Spacer size="xl" />

      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        SOUND & VIBRATION
      </ThemedText>
      <Card style={styles.card}>
        {renderSwitch(
          "Sound",
          "Play sound for notifications",
          notifications.soundEnabled,
          (v) => handleNotificationToggle("soundEnabled", v),
          "volume-2"
        )}
        {renderSwitch(
          "Vibration",
          "Vibrate for notifications",
          notifications.vibrationEnabled,
          (v) => handleNotificationToggle("vibrationEnabled", v),
          "smartphone"
        )}
      </Card>
    </View>
  );

  const renderLocationContent = () => (
    <View>
      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        LOCATION SERVICES
      </ThemedText>
      <Card style={styles.card}>
        {renderSwitch(
          "Enable Location",
          "Allow app to access your location",
          location.locationEnabled,
          (v) => handleLocationToggle("locationEnabled", v),
          "navigation"
        )}
        {renderSwitch(
          "Auto-Update Location",
          "Automatically update your location",
          location.autoUpdateLocation,
          (v) => handleLocationToggle("autoUpdateLocation", v),
          "refresh-cw"
        )}
      </Card>

      <Spacer size="xl" />

      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        SEARCH RADIUS
      </ThemedText>
      <Card style={styles.card}>
        <View style={styles.radiusContainer}>
          <View style={styles.radiusHeader}>
            <ThemedText type="body">Search Radius</ThemedText>
            <ThemedText type="h4" style={{ color: Colors.primary }}>
              {location.searchRadius} {location.showDistanceInKm ? "km" : "mi"}
            </ThemedText>
          </View>
          <Spacer size="md" />
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={50}
            step={5}
            value={location.searchRadius}
            onSlidingComplete={handleRadiusChange}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.radiusLabels}>
            <ThemedText type="caption" secondary>5 {location.showDistanceInKm ? "km" : "mi"}</ThemedText>
            <ThemedText type="caption" secondary>50 {location.showDistanceInKm ? "km" : "mi"}</ThemedText>
          </View>
        </View>
      </Card>

      <Spacer size="xl" />

      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        DISTANCE UNITS
      </ThemedText>
      <Card style={styles.card}>
        {renderSwitch(
          "Use Kilometers",
          "Show distances in kilometers instead of miles",
          location.showDistanceInKm,
          (v) => handleLocationToggle("showDistanceInKm", v),
          "globe"
        )}
      </Card>

      <Spacer size="xl" />

      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        DEFAULT LOCATION
      </ThemedText>
      <Card style={styles.card}>
        <Pressable
          style={[styles.settingRow, { borderBottomWidth: 0 }]}
          onPress={() => {
            Alert.alert(
              "Set Default City",
              "Enter your default city for when location is unavailable",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Use Current", onPress: () => {} },
              ]
            );
          }}
        >
          <View style={[styles.settingIcon, { backgroundColor: Colors.secondary + "15" }]}>
            <Feather name="home" size={18} color={Colors.secondary} />
          </View>
          <View style={styles.settingContent}>
            <ThemedText type="body">Default City</ThemedText>
            <ThemedText type="caption" secondary>
              {location.defaultCity || "Not set - using current location"}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </Card>
    </View>
  );

  const renderAppearanceContent = () => (
    <View>
      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        THEME
      </ThemedText>
      <Card style={styles.card}>
        {THEME_OPTIONS.map((option, index) => (
          <Pressable
            key={option.value}
            style={[
              styles.themeOption,
              index < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
            ]}
            onPress={() => handleThemeChange(option.value)}
          >
            <View style={[styles.settingIcon, { backgroundColor: Colors.primary + "15" }]}>
              <Feather name={option.icon as any} size={18} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="body">{option.label}</ThemedText>
              <ThemedText type="caption" secondary>
                {option.value === "system"
                  ? "Match device settings"
                  : option.value === "dark"
                  ? "Always use dark theme"
                  : "Always use light theme"}
              </ThemedText>
            </View>
            <View
              style={[
                styles.radioOuter,
                { borderColor: themeMode === option.value ? Colors.primary : theme.border },
              ]}
            >
              {themeMode === option.value && (
                <View style={[styles.radioInner, { backgroundColor: Colors.primary }]} />
              )}
            </View>
          </Pressable>
        ))}
      </Card>

      <Spacer size="xl" />

      <ThemedText type="caption" secondary style={styles.sectionHeader}>
        PREVIEW
      </ThemedText>
      <Card style={styles.card}>
        <View style={styles.previewContainer}>
          <View style={[styles.previewBox, { backgroundColor: isDark ? "#1F2123" : "#FFFFFF" }]}>
            <View style={[styles.previewHeader, { backgroundColor: isDark ? "#2A2C2E" : "#F5F5F5" }]}>
              <View style={[styles.previewDot, { backgroundColor: Colors.primary }]} />
              <View style={[styles.previewLine, { backgroundColor: isDark ? "#404244" : "#E0E0E0" }]} />
            </View>
            <View style={styles.previewContent}>
              <View style={[styles.previewCard, { backgroundColor: isDark ? "#353739" : "#EDEDED" }]} />
              <View style={[styles.previewCard, { backgroundColor: isDark ? "#353739" : "#EDEDED", width: "60%" }]} />
            </View>
          </View>
          <ThemedText type="small" style={styles.previewLabel}>
            {isDark ? "Dark Mode" : "Light Mode"}
          </ThemedText>
        </View>
      </Card>

      <Spacer size="xl" />

      <Card style={[styles.card, { backgroundColor: Colors.primary + "10" }]}>
        <View style={styles.infoBox}>
          <Feather name="info" size={20} color={Colors.primary} />
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              About Dark Mode
            </ThemedText>
            <ThemedText type="caption" secondary style={{ marginTop: 4 }}>
              Dark mode reduces eye strain in low-light conditions and can help save battery on OLED screens.
            </ThemedText>
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.md },
        ]}
      >
        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundSecondary }]}>
          {renderTab("notifications", "bell", "Notifications")}
          {renderTab("location", "map-pin", "Location")}
          {renderTab("appearance", "moon", "Appearance")}
        </View>

        <Spacer size="xl" />

        {/* Content based on active tab */}
        {activeTab === "notifications" && renderNotificationsContent()}
        {activeTab === "location" && renderLocationContent()}
        {activeTab === "appearance" && renderAppearanceContent()}

        <Spacer size="3xl" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    gap: Spacing.xs,
  },
  tabLabel: {
    marginLeft: Spacing.xs,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingDescription: {
    marginTop: 2,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radiusContainer: {
    padding: Spacing.lg,
  },
  radiusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  radiusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewContainer: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  previewBox: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  previewHeader: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  previewLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  previewContent: {
    flex: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  previewCard: {
    height: 40,
    borderRadius: BorderRadius.xs,
  },
  previewLabel: {
    marginTop: Spacing.md,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    padding: Spacing.md,
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
