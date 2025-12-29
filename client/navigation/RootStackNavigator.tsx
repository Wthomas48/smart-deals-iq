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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animationTypeForReplace: "pop" }}
        />
      ) : user?.role === "vendor" ? (
        <Stack.Screen name="VendorMain" component={VendorTabNavigator} />
      ) : (
        <Stack.Screen name="CustomerMain" component={CustomerTabNavigator} />
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
