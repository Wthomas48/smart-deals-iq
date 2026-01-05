// Smart Deals IQ - Production App Configuration
// This file replaces app.json for dynamic environment variable support

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

// App identifiers - different for dev builds to allow side-by-side installation
const getAppIdentifier = () => {
  if (IS_DEV) return "com.smartdealsiq.app.dev";
  if (IS_PREVIEW) return "com.smartdealsiq.app.preview";
  return "com.smartdealsiq.app";
};

const getAppName = () => {
  if (IS_DEV) return "SmartDealsIQ (Dev)";
  if (IS_PREVIEW) return "SmartDealsIQ (Preview)";
  return "Smart Deals IQ";
};

export default {
  expo: {
    name: getAppName(),
    slug: "smartdealsiq",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "smartdealsiq",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    owner: "wthomas48",

    // EAS Configuration
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "",
      },
      // Runtime environment detection
      isProduction: !IS_DEV && !IS_PREVIEW,
    },

    // OTA Updates (only for production)
    updates: {
      enabled: !IS_DEV,
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || ""}`,
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "appVersion",
    },

    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: getAppIdentifier(),
      buildNumber: "1",
      infoPlist: {
        // Privacy usage descriptions - REQUIRED for App Store
        NSLocationWhenInUseUsageDescription:
          "Smart Deals IQ uses your location to find nearby vendors and deals in your area.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Smart Deals IQ uses your location to notify you about nearby deals even when the app is in the background.",
        NSCameraUsageDescription:
          "Smart Deals IQ uses the camera to scan QR codes for deals and promotions.",
        NSPhotoLibraryUsageDescription:
          "Smart Deals IQ accesses your photos to let you upload images for your profile and promotions.",
        // Background modes
        UIBackgroundModes: ["location", "fetch", "remote-notification"],
        // App Transport Security - allows HTTPS connections
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
        },
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      },
      // Associated domains for deep linking (add your domain)
      associatedDomains: [
        "applinks:smartdealsiq.com",
        "applinks:*.smartdealsiq.com",
      ],
      // Privacy manifest for App Store (iOS 17+)
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
          },
        ],
      },
    },

    // Android Configuration
    android: {
      adaptiveIcon: {
        backgroundColor: "#FF6B35",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      package: getAppIdentifier(),
      versionCode: 1,
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "POST_NOTIFICATIONS",
      ],
      // Removed: ACCESS_BACKGROUND_LOCATION (requires Play Store justification)
      // Removed: READ/WRITE_EXTERNAL_STORAGE (deprecated in Android 13+)
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
      // Intent filters for deep linking
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "smartdealsiq.com",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    // Web Configuration
    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },

    // Plugins Configuration
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FF6B35",
          dark: {
            backgroundColor: "#1F2123",
          },
        },
      ],
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Smart Deals IQ uses your location to show nearby vendors and deals.",
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Smart Deals IQ uses the camera to scan QR codes for deals.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#FF6B35",
        },
      ],
    ],

    // Experiments
    experiments: {
      reactCompiler: true,
    },
  },
};
