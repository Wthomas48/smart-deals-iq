import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";

import OnboardingScreen from "@/screens/OnboardingScreen";
import CustomerTabNavigator from "@/navigation/CustomerTabNavigator";
import VendorTabNavigator from "@/navigation/VendorTabNavigator";

export type RootStackParamList = {
  Onboarding: undefined;
  CustomerMain: undefined;
  VendorMain: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const { user, isLoading, isAuthenticated } = useAuth();

  // Debug logging for auth state (development only)
  if (__DEV__) {
    console.log("[RootStackNavigator] Auth state changed:", {
      isLoading,
      isAuthenticated,
      authState: !isAuthenticated ? "guest" : user?.role === "vendor" ? "vendor" : "customer",
      userRole: user?.role,
      userEmail: user?.email,
    });
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Determine which screen set to show based on auth state
  const authState = !isAuthenticated ? "guest" : user?.role === "vendor" ? "vendor" : "customer";

  // Navigation logic:
  // - Authenticated vendors -> VendorTabNavigator (vendor dashboard)
  // - Authenticated customers -> CustomerTabNavigator
  // - Not authenticated -> Show Onboarding/Login screen first
  return (
    <Stack.Navigator
      key={authState}  // Force re-render when auth state changes
      screenOptions={{ ...screenOptions, headerShown: false }}
    >
      {!isAuthenticated ? (
        // Not logged in - show login screen first
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="CustomerMain" component={CustomerTabNavigator} />
          <Stack.Screen name="VendorMain" component={VendorTabNavigator} />
        </>
      ) : user?.role === "vendor" ? (
        // Authenticated vendor - show vendor dashboard
        <>
          <Stack.Screen name="VendorMain" component={VendorTabNavigator} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      ) : (
        // Authenticated customer - show customer app
        <>
          <Stack.Screen name="CustomerMain" component={CustomerTabNavigator} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
