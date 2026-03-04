import React from "react";
import { StyleSheet, Image, Pressable, Platform } from "react-native";
import { useNavigation, StackActions } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface HeaderTitleProps {
  title?: string;
}

export function HeaderTitle({ title = "SmartDealsIQ™" }: HeaderTitleProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const handleLogoPress = () => {
    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Invalidate all cached queries to force fresh data on next render
    queryClient.invalidateQueries();

    // Pop to the root of the current stack (e.g. DealsFeed or Dashboard)
    if (navigation.canGoBack()) {
      navigation.dispatch(StackActions.popToTop());
    }
  };

  return (
    <Pressable onPress={handleLogoPress} style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});
