# SmartDealsIQ

## Overview
SmartDealsIQ is a mobile-first application for discovering deals from restaurants, small businesses, and food vendors near you. The app serves two distinct user types:

1. **Customers**: Discover nearby deals from restaurants, cafes, food trucks, and local food businesses; follow favorites and view on map
2. **Vendors/Businesses**: Manage promotions, track analytics, use AI tools, manage customer CRM

## Tech Stack
- **Frontend**: React Native with Expo (Expo Go compatible)
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (for future use)
- **Local Storage**: AsyncStorage for MVP

## Project Structure
```
client/
├── App.tsx                 # Main app entry with providers
├── components/             # Reusable UI components
├── constants/theme.ts      # Design tokens (colors, spacing, typography)
├── hooks/                  # Custom hooks (useTheme, useAuth, etc.)
├── lib/
│   ├── auth-context.tsx    # Authentication state management
│   ├── data-context.tsx    # Data management (vendors, deals, favorites)
│   ├── location-context.tsx # GPS location management with expo-location
│   ├── notification-service.tsx # Push notification integration
│   └── query-client.ts     # React Query setup
├── navigation/
│   ├── RootStackNavigator.tsx      # Root navigation with auth check
│   ├── CustomerTabNavigator.tsx    # Customer tab navigation
│   └── VendorTabNavigator.tsx      # Vendor tab navigation
└── screens/
    ├── OnboardingScreen.tsx        # Login/signup/role selection
    ├── ProfileScreen.tsx           # Shared profile/settings
    ├── customer/                   # Customer-specific screens
    │   ├── DealsFeedScreen.tsx     # Main deals feed
    │   ├── MapScreen.tsx           # Map view with vendor locations
    │   ├── FavoritesScreen.tsx     # Followed vendors
    │   └── VendorDetailScreen.tsx  # Vendor profile and deals
    └── vendor/                     # Vendor-specific screens
        ├── DashboardScreen.tsx     # Analytics dashboard
        ├── PromotionsScreen.tsx    # Create/manage promotions
        ├── CustomersScreen.tsx     # Customer CRM
        └── ToolsScreen.tsx         # AI tools, QR codes
```

## Design System
- **Primary Color**: #FF6B35 (Vibrant Orange)
- **Secondary Color**: #00B4A6 (Deep Teal)
- **Accent Color**: #FFC857 (Warm Yellow)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)

## Key Features (MVP)

### Customer App
- Deals feed sorted by proximity
- Interactive map with vendor locations
- Favorites/follow system with notification toggle
- Vendor detail with deals, menu, schedule tabs
- Search and filter capabilities

### Vendor Dashboard
- Analytics overview (impressions, clicks, redemptions, revenue)
- Promotion creation with AI-generated copy suggestions
- Customer CRM with filtering
- Tools: QR code generator, AI assistant

## Running the App
- Expo runs on port 8081
- Express backend runs on port 5000
- Use Expo Go app to test on physical devices

## Recent Changes
- Initial MVP implementation (December 2024)
- Role-based authentication and navigation
- Mock data for vendors, deals, and analytics
- AsyncStorage persistence for favorites and promotions
- GPS location integration with expo-location for real proximity-based deal sorting
- Push notification integration with expo-notifications for nearby vendor alerts
- LocationNotificationBridge component wires location updates to notification triggers
