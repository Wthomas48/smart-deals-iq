import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Image } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface SettingsItem {
  icon: string;
  label: string;
  value?: string;
  action?: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "This will permanently delete all your data. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete Forever", style: "destructive", onPress: logout },
              ]
            );
          },
        },
      ]
    );
  };

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "Account",
      items: [
        { icon: "user", label: "Display Name", value: user?.name },
        { icon: "mail", label: "Email", value: user?.email },
        { icon: "shield", label: "Account Type", value: user?.role === "vendor" ? "Vendor" : "Customer" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "bell", label: "Notifications", action: () => {} },
        { icon: "map-pin", label: "Location Settings", action: () => {} },
        { icon: "moon", label: "Appearance", value: "System" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle", label: "Help Center", action: () => {} },
        { icon: "message-circle", label: "Contact Us", action: () => {} },
        { icon: "file-text", label: "Privacy Policy", action: () => {} },
        { icon: "book-open", label: "Terms of Service", action: () => {} },
      ],
    },
    {
      title: "Account Actions",
      items: [
        { icon: "log-out", label: "Log Out", action: handleLogout },
        { icon: "trash-2", label: "Delete Account", action: handleDeleteAccount, danger: true },
      ],
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary + "20" }]}>
            <ThemedText type="h2" style={{ color: Colors.primary }}>
              {user?.name ? getInitials(user.name) : "U"}
            </ThemedText>
          </View>
          <ThemedText type="h3" style={styles.userName}>{user?.name}</ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: user?.role === "vendor" ? Colors.primary + "20" : Colors.secondary + "20" }]}>
            <Feather
              name={user?.role === "vendor" ? "truck" : "user"}
              size={14}
              color={user?.role === "vendor" ? Colors.primary : Colors.secondary}
            />
            <ThemedText
              type="caption"
              style={{ color: user?.role === "vendor" ? Colors.primary : Colors.secondary, marginLeft: Spacing.xs }}
            >
              {user?.role === "vendor" ? "Vendor Account" : "Customer Account"}
            </ThemedText>
          </View>
        </View>

        <Spacer size="2xl" />

        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText type="caption" secondary style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </ThemedText>
            <Card style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.settingsItem,
                    index < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}
                  onPress={item.action}
                  disabled={!item.action}
                >
                  <View style={[styles.iconContainer, { backgroundColor: (item.danger ? Colors.error : theme.textSecondary) + "15" }]}>
                    <Feather
                      name={item.icon as any}
                      size={18}
                      color={item.danger ? Colors.error : theme.textSecondary}
                    />
                  </View>
                  <ThemedText
                    type="body"
                    style={[styles.itemLabel, item.danger && { color: Colors.error }]}
                  >
                    {item.label}
                  </ThemedText>
                  {item.value ? (
                    <ThemedText type="small" secondary>{item.value}</ThemedText>
                  ) : item.action ? (
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  ) : null}
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        <Spacer size="xl" />

        <View style={styles.footer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <ThemedText type="caption" secondary>SmartDealsIQ</ThemedText>
          <ThemedText type="caption" secondary>Version 1.0.0</ThemedText>
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
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    marginTop: Spacing.lg,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionCard: {
    padding: 0,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  itemLabel: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
});
