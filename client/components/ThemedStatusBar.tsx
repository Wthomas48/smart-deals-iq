import React from "react";
import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/lib/theme-context";

export function ThemedStatusBar() {
  const { isDark } = useThemeContext();

  // Use "light" content (white text) on dark backgrounds
  // Use "dark" content (black text) on light backgrounds
  return <StatusBar style={isDark ? "light" : "dark"} />;
}
