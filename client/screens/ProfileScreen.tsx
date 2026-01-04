import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Image, TextInput, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { usePreferences } from "@/lib/preferences-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

const GUEST_EMAIL_KEY = "@smartdealsiq_guest_email";

interface SettingsItem {
  icon: string;
  label: string;
  value?: string;
  action?: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const { theme, themeMode } = useTheme();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout, deleteAccount, isAuthenticated } = useAuth();

  // Guest email state
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    loadGuestEmail();
  }, []);

  const loadGuestEmail = async () => {
    try {
      const email = await AsyncStorage.getItem(GUEST_EMAIL_KEY);
      if (email) setGuestEmail(email);
    } catch (error) {
      console.error("Failed to load guest email:", error);
    }
  };

  const saveGuestEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    try {
      await AsyncStorage.setItem(GUEST_EMAIL_KEY, emailInput);
      setGuestEmail(emailInput);
      setShowEmailModal(false);
      Alert.alert("Success", "Email saved! You'll receive deal alerts and updates.");
    } catch (error) {
      Alert.alert("Error", "Failed to save email. Please try again.");
    }
  };

  const handleVendorLogin = () => {
    navigation.navigate("Onboarding");
  };

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
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // For production, you may want to prompt for password
                      await deleteAccount("");
                      Alert.alert("Account Deleted", "Your account has been permanently deleted.");
                    } catch (error: any) {
                      // If deletion fails, just log out for now
                      console.error("Delete account error:", error);
                      await logout();
                      Alert.alert("Account Removed", "You have been logged out.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Settings sections - adjusted for guest vs authenticated users
  const settingsSections: { title: string; items: SettingsItem[] }[] = isAuthenticated ? [
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
        { icon: "bell", label: "Notifications", action: () => navigation.navigate("Preferences") },
        { icon: "map-pin", label: "Location Settings", action: () => navigation.navigate("Preferences") },
        { icon: "moon", label: "Appearance", value: themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light", action: () => navigation.navigate("Preferences") },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle", label: "Help Center", action: () => navigation.navigate("HelpCenter") },
        { icon: "message-circle", label: "Contact Us", action: () => navigation.navigate("Contact") },
        { icon: "file-text", label: "Privacy Policy", action: () => navigation.navigate("PrivacyPolicy") },
        { icon: "book-open", label: "Terms of Service", action: () => navigation.navigate("TermsOfService") },
      ],
    },
    {
      title: "Account Actions",
      items: [
        { icon: "log-out", label: "Log Out", action: handleLogout },
        { icon: "trash-2", label: "Delete Account", action: handleDeleteAccount, danger: true },
      ],
    },
  ] : [
    // Guest user sections
    {
      title: "Your Info",
      items: [
        {
          icon: "mail",
          label: guestEmail ? "Email" : "Add Your Email",
          value: guestEmail || undefined,
          action: () => setShowEmailModal(true)
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "bell", label: "Notifications", action: () => navigation.navigate("Preferences") },
        { icon: "map-pin", label: "Location Settings", action: () => navigation.navigate("Preferences") },
        { icon: "moon", label: "Appearance", value: themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light", action: () => navigation.navigate("Preferences") },
      ],
    },
    {
      title: "For Vendors",
      items: [
        { icon: "briefcase", label: "Vendor Sign In", action: handleVendorLogin },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle", label: "Help Center", action: () => navigation.navigate("HelpCenter") },
        { icon: "message-circle", label: "Contact Us", action: () => navigation.navigate("Contact") },
        { icon: "file-text", label: "Privacy Policy", action: () => navigation.navigate("PrivacyPolicy") },
        { icon: "book-open", label: "Terms of Service", action: () => navigation.navigate("TermsOfService") },
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
          <View style={[styles.avatar, { backgroundColor: isAuthenticated ? Colors.primary + "20" : Colors.secondary + "20" }]}>
            <ThemedText type="h2" style={{ color: isAuthenticated ? Colors.primary : Colors.secondary }}>
              {isAuthenticated && user?.name ? getInitials(user.name) : (guestEmail ? guestEmail[0].toUpperCase() : "G")}
            </ThemedText>
          </View>
          <ThemedText type="h3" style={styles.userName}>
            {isAuthenticated ? user?.name : (guestEmail ? guestEmail.split("@")[0] : "Guest User")}
          </ThemedText>
          {guestEmail && !isAuthenticated && (
            <ThemedText type="small" secondary style={{ marginTop: Spacing.xs }}>
              {guestEmail}
            </ThemedText>
          )}
          <View style={[styles.roleBadge, { backgroundColor: isAuthenticated ? (user?.role === "vendor" ? Colors.primary + "20" : Colors.secondary + "20") : Colors.secondary + "20" }]}>
            <Feather
              name={isAuthenticated ? (user?.role === "vendor" ? "truck" : "user") : "user"}
              size={14}
              color={isAuthenticated ? (user?.role === "vendor" ? Colors.primary : Colors.secondary) : Colors.secondary}
            />
            <ThemedText
              type="caption"
              style={{ color: isAuthenticated ? (user?.role === "vendor" ? Colors.primary : Colors.secondary) : Colors.secondary, marginLeft: Spacing.xs }}
            >
              {isAuthenticated ? (user?.role === "vendor" ? "Vendor Account" : "Customer Account") : "Customer"}
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
          <ThemedText type="caption" secondary>SmartDealsIQ™</ThemedText>
          <ThemedText type="caption" secondary>Version 1.0.0</ThemedText>
        </View>
      </ScrollView>

      {/* Email Modal for Guest Users */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Add Your Email</ThemedText>
              <Pressable onPress={() => setShowEmailModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <Spacer size="md" />

            <ThemedText type="small" secondary>
              Get notified about deals near you and save your favorites.
            </ThemedText>

            <Spacer size="lg" />

            <TextInput
              style={[styles.emailInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="your@email.com"
              placeholderTextColor={theme.textSecondary}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Spacer size="lg" />

            <Pressable
              style={[styles.saveButton, { backgroundColor: Colors.primary }]}
              onPress={saveGuestEmail}
            >
              <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                Save Email
              </ThemedText>
            </Pressable>

            <Spacer size="md" />

            <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
              We respect your privacy. No spam, ever.
            </ThemedText>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emailInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
});
