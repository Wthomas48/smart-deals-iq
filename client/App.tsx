import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import { ThemeProvider } from "@/lib/theme-context";
import { PreferencesProvider } from "@/lib/preferences-context";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { VendorListingProvider } from "@/lib/vendor-listing-context";
import { LocationProvider } from "@/lib/location-context";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { GamificationProvider } from "@/lib/gamification-context";
import { OfflineProvider } from "@/lib/offline-context";
import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LocationNotificationBridge } from "@/components/LocationNotificationBridge";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PreferencesProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <DataProvider>
                <VendorListingProvider>
                  <LocationProvider>
                    <SubscriptionProvider>
                      <GamificationProvider>
                        <OfflineProvider>
                          <LocationNotificationBridge />
                          <SafeAreaProvider>
                            <GestureHandlerRootView style={styles.root}>
                              <KeyboardProvider>
                                <NavigationContainer>
                                  <RootStackNavigator />
                                </NavigationContainer>
                                <ThemedStatusBar />
                              </KeyboardProvider>
                            </GestureHandlerRootView>
                          </SafeAreaProvider>
                        </OfflineProvider>
                      </GamificationProvider>
                    </SubscriptionProvider>
                  </LocationProvider>
                </VendorListingProvider>
              </DataProvider>
            </AuthProvider>
          </QueryClientProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
