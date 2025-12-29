# SmartDealsIQ Design Guidelines

## Architecture Decisions

### Authentication
**Required** - Two distinct user types (Customers and Vendors) with different permission levels.

**Implementation:**
- SSO preferred: Apple Sign-In (iOS), Google Sign-In (Android/cross-platform)
- User type selection during onboarding (Customer or Vendor)
- Separate navigation flows post-authentication based on user type
- Account screen includes:
  - Profile photo (allow camera upload or preset food-themed avatars)
  - Display name, email (read-only from SSO)
  - Notification preferences
  - Privacy policy & terms of service links
  - Log out (with confirmation)
  - Delete account (Settings > Account > Delete with double confirmation)

### Navigation Architecture

**Customer App:**
- **Tab Navigation** (4 tabs + floating action):
  1. **Deals Feed** - Primary screen showing proximity-sorted deals
  2. **Map** - Real-time vendor locations (GPS view)
  3. **Favorites** - Saved/followed vendors
  4. **Profile** - Settings, reviews, account
  - **Floating Action Button** - Search/Filter (overlays on all tabs)

**Vendor Dashboard:**
- **Drawer Navigation** (desktop) / **Tab Navigation** (mobile, 4 tabs):
  1. **Dashboard** - Analytics overview
  2. **Promotions** - Create/manage deals
  3. **Customers** - CRM and insights
  4. **Tools** - QR codes, AI features, printing

## Screen Specifications

### Customer App Screens

**1. Deals Feed (Home)**
- Purpose: Discover nearby vendor deals sorted by proximity
- Layout:
  - Transparent header with location indicator (left) and filter icon (right)
  - Scrollable vertical feed
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components:
  - Location permission banner (if denied)
  - Deal cards showing: vendor name, deal description, distance, image, rating, expiration time
  - Pull-to-refresh
  - Empty state: "No deals nearby - try expanding your radius"

**2. Map View**
- Purpose: Visual GPS tracking of vendor locations
- Layout:
  - Transparent header with search (left) and filter (right)
  - Full-screen map view
  - Floating vendor info card (bottom sheet when vendor selected)
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components:
  - Custom map markers (food truck icon with vendor logo)
  - User location indicator
  - Radius selector (1mi, 5mi, 10mi)
  - Bottom sheet: vendor name, current deal, distance, "View Details" CTA

**3. Search/Filter Modal**
- Purpose: Refine deal discovery by cuisine, price, dietary needs
- Layout: Native modal (slides up from bottom)
  - Header with "Filters" title, Cancel (left), Apply (right)
  - Scrollable form
  - Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl
- Components:
  - Search bar (cuisine/vendor name)
  - Filter chips: Price Range ($, $$, $$$), Dietary (Vegan, Gluten-Free, etc.)
  - Distance slider (1-20 miles)
  - "Clear All" text button

**4. Vendor Detail**
- Purpose: View vendor profile, menu, schedule, reviews
- Layout:
  - Default navigation header with back button
  - Scrollable content
  - Floating "Follow" button (top-right)
  - Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components:
  - Hero image, vendor name, rating, distance
  - Tabbed sections: Active Deals, Menu, Schedule, Reviews
  - Social share button (sticky below hero)

**5. Favorites**
- Purpose: Quick access to followed vendors
- Layout:
  - Default header with "Favorites" title
  - Scrollable list or empty state
  - Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Components:
  - Vendor cards (compact): name, current location, active deal count
  - Toggle: "Notify me when nearby"
  - Empty state: "Follow your favorite vendors to see them here"

### Vendor Dashboard Screens

**6. Analytics Dashboard**
- Purpose: Performance metrics at a glance
- Layout:
  - Default header with date range selector (right)
  - Scrollable content
  - Safe area: top = Spacing.xl, bottom = drawer/tab based
- Components:
  - KPI cards: Impressions, Clicks, Redemptions, Revenue
  - Line chart: 7/30-day trends
  - Benchmarking card: "You're outperforming 68% of taco trucks in your area"

**7. Create Promotion**
- Purpose: Launch new deals/promotions
- Layout:
  - Header with Cancel (left), "Create" (right, disabled until valid)
  - Scrollable form
  - AI suggestion button (floating, bottom-right)
  - Safe area: top = Spacing.xl, bottom based on nav
- Components:
  - Deal text input (AI-generated suggestions via bottom sheet)
  - Pricing fields (original/discounted)
  - Schedule picker (start/end date-time)
  - AI image generator prompt field
  - Preview card

**8. Customer CRM**
- Purpose: Track repeat customers and send targeted offers
- Layout:
  - Header with search bar
  - Scrollable list
  - Safe area: standard based on nav
- Components:
  - Customer list: name/photo, visit count, last visit, total spent
  - Filter: "Top Spenders," "At Risk," "New This Month"
  - Quick action: "Send Offer" (opens modal)

## Design System

### Color Palette
- **Primary:** Vibrant Orange (#FF6B35) - Energy, food, urgency
- **Secondary:** Deep Teal (#00B4A6) - Trust, location/navigation
- **Accent:** Warm Yellow (#FFC857) - Featured deals, AI suggestions
- **Neutral:** Dark Gray (#2D3142), Light Gray (#F5F5F5), White (#FFFFFF)
- **Success:** Green (#10B981) - Active deals, verified vendors
- **Error:** Red (#EF4444) - Expired deals, errors

### Typography
- **Headings:** SF Pro Display (iOS) / Roboto (Android), Bold, 24-28pt
- **Body:** SF Pro Text / Roboto, Regular, 16pt
- **Captions:** 12-14pt, Medium weight for distances/times

### Key Visual Elements
- Deal cards: Rounded corners (12px), subtle shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08)
- Floating action button: Drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- Distance badges: Pill-shaped, teal background, white text
- Countdown timers: Yellow accent color when <1 hour remaining

### Critical Assets
1. **Vendor category icons** (8-10): Tacos, Burgers, Pizza, Asian, Desserts, BBQ, etc. - Simplified, colorful line art
2. **Map marker icon:** Custom food truck silhouette (2 variations: default, selected)
3. **Preset avatars (Customer):** 6 food-themed illustrations (pizza slice, coffee cup, etc.)
4. **Preset avatars (Vendor):** 6 food truck illustrations (different truck styles)
5. **Empty state illustrations:** GPS denied, no deals nearby, no favorites

### Interaction Patterns
- All touchable elements: Scale transform (0.97) on press
- Deal cards: Haptic feedback on press (iOS)
- Follow/unfollow: Optimistic UI update with toast confirmation
- Map markers: Bounce animation when vendor updates location
- Promotion scheduler: Time picker matches native iOS/Android patterns

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 for text, 3:1 for UI elements
- Distance/time labels: Include screen reader descriptions ("2.3 miles away")
- Map: VoiceOver announces vendor names and deal summaries when focused