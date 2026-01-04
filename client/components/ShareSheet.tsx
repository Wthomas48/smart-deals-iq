import React from "react";
import { View, StyleSheet, Pressable, Modal, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  socialShareService,
  SharePlatform,
  FoodTruckShareData,
} from "@/lib/social-share-service";

interface ShareOption {
  id: SharePlatform;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: "facebook",
    label: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    bgColor: "#1877F220",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "instagram",
    color: "#E4405F",
    bgColor: "#E4405F20",
  },
  {
    id: "twitter",
    label: "X",
    icon: "twitter",
    color: "#000000",
    bgColor: "#00000015",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "message-circle",
    color: "#25D366",
    bgColor: "#25D36620",
  },
  {
    id: "sms",
    label: "Text",
    icon: "message-square",
    color: "#34C759",
    bgColor: "#34C75920",
  },
  {
    id: "native",
    label: "More",
    icon: "share",
    color: Colors.primary,
    bgColor: Colors.primary + "20",
  },
];

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  truckData: FoodTruckShareData;
  title?: string;
}

export function ShareSheet({ visible, onClose, truckData, title = "Share this food truck" }: ShareSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleShare = async (platform: SharePlatform) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await socialShareService.shareFoodTruck(truckData, platform);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.lg },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="h4">{title}</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Preview */}
          <View style={[styles.preview, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.previewIcon}>
              <Feather name="truck" size={24} color={Colors.primary} />
            </View>
            <View style={styles.previewContent}>
              <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                {truckData.truckName}
              </ThemedText>
              {truckData.location && (
                <ThemedText type="caption" secondary numberOfLines={1}>
                  {truckData.location}
                </ThemedText>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: truckData.isOpen ? Colors.success + "20" : Colors.error + "20" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: truckData.isOpen ? Colors.success : Colors.error },
                ]}
              />
              <ThemedText
                type="caption"
                style={{ color: truckData.isOpen ? Colors.success : Colors.error }}
              >
                {truckData.isOpen ? "Open" : "Closed"}
              </ThemedText>
            </View>
          </View>

          <Spacer size="lg" />

          {/* Share Options */}
          <View style={styles.optionsGrid}>
            {SHARE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleShare(option.id)}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.bgColor }]}>
                  <Feather name={option.icon as any} size={24} color={option.color} />
                </View>
                <ThemedText type="caption" style={{ marginTop: Spacing.xs }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Spacer size="lg" />

          {/* Copy Link */}
          <Pressable
            style={[styles.copyButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => handleShare("native")}
          >
            <Feather name="link" size={18} color={theme.text} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
              Copy Link
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Simple share button component
interface ShareButtonProps {
  onPress: () => void;
  size?: "small" | "medium" | "large";
  style?: any;
}

export function ShareButton({ onPress, size = "medium", style }: ShareButtonProps) {
  const { theme } = useTheme();

  const iconSize = size === "small" ? 18 : size === "large" ? 28 : 22;
  const buttonSize = size === "small" ? 36 : size === "large" ? 52 : 44;

  return (
    <Pressable
      style={[
        styles.shareButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: theme.backgroundDefault,
        },
        style,
      ]}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
    >
      <Feather name="share-2" size={iconSize} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  handleContainer: {
    alignItems: "center",
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionItem: {
    width: "30%",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  shareButton: {
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.card,
  },
});
