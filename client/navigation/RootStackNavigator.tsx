import React, { useEffect, useRef } from "react";
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

const GuestStack = createNativeStackNavigator<RootStackParamList>();
const CustomerStack = createNativeStackNavigator<RootStackParamList>();
const VendorStack = createNativeStackNavigator<RootStackParamList>();

function GuestNavigator({ screenOptions }: { screenOptions: any }) {
  return (
    <GuestStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <GuestStack.Screen name="Onboarding" component={OnboardingScreen} />
    </GuestStack.Navigator>
  );
}

function CustomerNavigator({ screenOptions }: { screenOptions: any }) {
  return (
    <CustomerStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <CustomerStack.Screen name="CustomerMain" component={CustomerTabNavigator} />
      <CustomerStack.Screen name="Onboarding" component={OnboardingScreen} />
    </CustomerStack.Navigator>
  );
}

function VendorNavigator({ screenOptions }: { screenOptions: any }) {
  return (
    <VendorStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <VendorStack.Screen name="VendorMain" component={VendorTabNavigator} />
      <VendorStack.Screen name="Onboarding" component={OnboardingScreen} />
    </VendorStack.Navigator>
  );
}

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const { user, isLoading, isAuthenticated } = useAuth();

  if (__DEV__) {
    console.log("[RootStackNavigator] Auth state:", {
      isLoading,
      isAuthenticated,
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

  // Conditionally render entirely separate navigator trees.
  // This guarantees a full unmount/remount when auth state changes,
  // avoiding stale navigation state between customer/vendor/guest.
  if (!isAuthenticated) {
    return <GuestNavigator screenOptions={screenOptions} />;
  }

  if (user?.role === "vendor") {
    return <VendorNavigator screenOptions={screenOptions} />;
  }

  return <CustomerNavigator screenOptions={screenOptions} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
