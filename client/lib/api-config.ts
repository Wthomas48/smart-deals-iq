import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Centralized API configuration with platform-aware URL resolution.
 *
 * - Web browser: Uses localhost (same machine)
 * - iOS Simulator: Uses localhost (same machine)
 * - Android Emulator: Uses 10.0.2.2 (Android's localhost alias)
 * - Physical devices: Uses LAN IP from EXPO_PUBLIC_API_URL
 */

const DEFAULT_PORT = "5000";

// Get the LAN IP from environment (for physical devices)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || "";

// Extract host and port from environment URL
function parseEnvUrl(): { host: string; port: string } {
  try {
    if (ENV_API_URL) {
      const url = new URL(ENV_API_URL);
      return {
        host: url.hostname,
        port: url.port || DEFAULT_PORT,
      };
    }
  } catch {
    // Invalid URL, use defaults
  }
  return { host: "localhost", port: DEFAULT_PORT };
}

/**
 * Determines if the app is running on a physical device vs simulator/emulator.
 */
function isPhysicalDevice(): boolean {
  // Check Expo's device type
  if (Constants.executionEnvironment === "storeClient") {
    return true; // Expo Go on physical device
  }

  // Check for simulator/emulator indicators
  if (Platform.OS === "ios") {
    // iOS Simulator has specific model names
    return !Constants.platform?.ios?.model?.includes("Simulator");
  }

  if (Platform.OS === "android") {
    // Android emulator detection
    const isEmulator = Constants.isDevice === false;
    return !isEmulator;
  }

  // Web is never a "physical device" in this context
  return false;
}

/**
 * Gets the appropriate API base URL for the current platform.
 */
export function getApiBaseUrl(): string {
  const { host, port } = parseEnvUrl();

  // Web browser - always use localhost
  if (Platform.OS === "web") {
    return `http://localhost:${port}`;
  }

  // iOS Simulator - use localhost
  if (Platform.OS === "ios" && !isPhysicalDevice()) {
    return `http://localhost:${port}`;
  }

  // Android Emulator - use special Android localhost alias
  if (Platform.OS === "android" && !isPhysicalDevice()) {
    return `http://10.0.2.2:${port}`;
  }

  // Physical device - use LAN IP from environment
  if (ENV_API_URL) {
    return ENV_API_URL;
  }

  // Fallback to localhost (might not work on physical devices)
  if (__DEV__) {
    console.warn(
      "[API Config] No EXPO_PUBLIC_API_URL set. Physical devices may not connect properly."
    );
  }
  return `http://localhost:${port}`;
}

/**
 * API configuration object for use across the app.
 */
export const apiConfig = {
  get baseUrl(): string {
    return getApiBaseUrl();
  },

  get port(): string {
    return parseEnvUrl().port;
  },

  /**
   * Builds a full API endpoint URL.
   */
  endpoint(path: string): string {
    const base = getApiBaseUrl();
    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  },
};

// Log configuration in development
if (__DEV__) {
  console.log("[API Config] Platform:", Platform.OS);
  console.log("[API Config] Physical device:", isPhysicalDevice());
  console.log("[API Config] Base URL:", getApiBaseUrl());
}

export default apiConfig;
