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

import DashboardScreen from "@/screens/vendor/DashboardScreen";
import PromotionsScreen from "@/screens/vendor/PromotionsScreen";
import CustomersScreen from "@/screens/vendor/CustomersScreen";
import ToolsScreen from "@/screens/vendor/ToolsScreen";
import ProfileScreen from "@/screens/ProfileScreen";

export type VendorStackParamList = {
  Dashboard: undefined;
  Promotions: undefined;
  Customers: undefined;
  Tools: undefined;
  Profile: undefined;
};

export type VendorTabParamList = {
  DashboardTab: undefined;
  PromotionsTab: undefined;
  CustomersTab: undefined;
  ToolsTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<VendorStackParamList>();
const Tab = createBottomTabNavigator<VendorTabParamList>();

function DashboardStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
        }}
      />
    </Stack.Navigator>
  );
}

function PromotionsStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Promotions"
        component={PromotionsScreen}
        options={{
          headerTitle: "Promotions",
        }}
      />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          headerTitle: "Customers",
        }}
      />
    </Stack.Navigator>
  );
}

function ToolsStack() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Tools"
        component={ToolsScreen}
        options={{
          headerTitle: "Tools",
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
    </Stack.Navigator>
  );
}

export default function VendorTabNavigator() {
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
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PromotionsTab"
        component={PromotionsStack}
        options={{
          title: "Promos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="tag" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersStack}
        options={{
          title: "Customers",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ToolsTab"
        component={ToolsStack}
        options={{
          title: "Tools",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
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
