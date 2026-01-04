import { registerRootComponent } from "expo";
import { Platform } from "react-native";

import App from "@/App";

// Global unhandled promise rejection handler for debugging
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Unhandled Promise Rejection]", {
      reason: event.reason,
      promise: event.promise,
      stack: event.reason?.stack,
    });
  });
}

registerRootComponent(App);
