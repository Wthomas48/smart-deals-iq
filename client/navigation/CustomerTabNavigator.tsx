import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Colors } from "@/constants/theme";

import DealsFeedScreen from "@/screens/customer/DealsFeedScreen";
import MapScreen from "@/screens/customer/MapScreen";
import FavoritesScreen from "@/screens/customer/FavoritesScreen";
import VendorDetailScreen from "@/screens/customer/VendorDetailScreen";
import DealDetailScreen from "@/screens/customer/DealDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import PreferencesScreen from "@/screens/PreferencesScreen";
import HelpCenterScreen from "@/screens/HelpCenterScreen";
import ContactScreen from "@/screens/ContactScreen";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "@/screens/TermsOfServiceScreen";

export type CustomerStackParamList = {
  DealsFeed: undefined;
  Map: undefined;
  Favorites: undefined;
  VendorDetail: { vendorId: string };
  DealDetail: { dealId: string };
  Profile: undefined;
  Preferences: undefined;
  HelpCenter: undefined;
  Contact: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type CustomerTabParamList = {
  DealsTab: undefined;
  MapTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();
const Tab = createBottomTabNavigator<CustomerTabParamList>();

function DealsStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DealsFeed"
        component={DealsFeedScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
        }}
      />
      <Stack.Screen
        name="VendorDetail"
        component={VendorDetailScreen}
        options={{
          headerTitle: "Vendor Details",
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="DealDetail"
        component={DealDetailScreen}
        options={{
          headerTitle: "Deal Details",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MapStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerTitle: "Nearby",
        }}
      />
      <Stack.Screen
        name="VendorDetail"
        component={VendorDetailScreen}
        options={{
          headerTitle: "Vendor Details",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerTitle: "Favorites",
        }}
      />
      <Stack.Screen
        name="VendorDetail"
        component={VendorDetailScreen}
        options={{
          headerTitle: "Vendor Details",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "Profile",
        }}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{
          headerTitle: "Preferences",
        }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{
          headerTitle: "Help Center",
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerTitle: "Contact Us",
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          headerTitle: "Privacy Policy",
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          headerTitle: "Terms of Service",
        }}
      />
    </Stack.Navigator>
  );
}

export default function CustomerTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DealsTab"
        component={DealsStack}
        options={{
          title: "Deals",
          tabBarIcon: ({ color, size }) => (
            <Feather name="tag" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{
          title: "Nearby",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map-pin" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStack}
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
