import { Platform } from "react-native";

const primaryOrange = "#FF6B35";
const secondaryTeal = "#00B4A6";
const accentYellow = "#FFC857";
const successGreen = "#10B981";
const errorRed = "#EF4444";

export const Colors = {
  primary: primaryOrange,
  secondary: secondaryTeal,
  accent: accentYellow,
  success: successGreen,
  error: errorRed,
  // Additional semantic colors
  warning: "#F59E0B",
  info: "#3B82F6",
  textSecondary: "#9BA1A6",
  light: {
    text: "#2D3142",
    textSecondary: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: primaryOrange,
    link: primaryOrange,
    background: "#FFFFFF",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#EDEDED",
    backgroundTertiary: "#E0E0E0",
    border: "#E0E0E0",
    card: "#FFFFFF",
    cardShadow: "rgba(0,0,0,0.08)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryOrange,
    link: primaryOrange,
    background: "#1F2123",
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    border: "#404244",
    card: "#2A2C2E",
    cardShadow: "rgba(0,0,0,0.3)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Platform-aware shadow styles
// Uses boxShadow on web, native shadow props on iOS, elevation on Android
const createShadow = (
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number
) => {
  if (Platform.OS === "web") {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    };
  }
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
};

export const Shadows = {
  sm: createShadow(1, 4, 0.05, 2),
  card: createShadow(2, 8, 0.08, 3),
  fab: createShadow(4, 8, 0.15, 6),
  lg: createShadow(4, 12, 0.12, 8),
  xl: createShadow(8, 16, 0.15, 12),
};
