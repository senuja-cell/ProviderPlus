import React, { useEffect, useRef } from 'react';
import { Image, View, StyleSheet, Platform, Animated, TouchableOpacity, Text } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from './../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────
// ✏️  EDIT YOUR ROUTES HERE
//
// Each entry needs:
//   tabFile  → the filename (no extension) of the .tsx inside app/(tabs)/
//              This is what Expo Router uses to register the screen.
//   path     → where pressing this tab actually navigates to.
//              Usually the same as tabFile, but can differ (e.g. Survy
//              lives in (tabs)/Survy.tsx but navigates to /AiPage).
//   label    → text shown under the icon
//   icon     → icon image
//
// If tabFile and path differ, the tab press is intercepted and router.push
// is called instead of the default navigation.
// ─────────────────────────────────────────────────────────────────────
const ROUTES = {
  // ── User / Guest tabs ──────────────────────────────────────────────
  home:            { tabFile: 'index',           path: '/(tabs)/index',           label: 'HOME',     icon: require('../../assets/images/home.png') },
  survy:           { tabFile: 'PendingProviders',           path: '/PendingProviders',                 label: 'SURVY',    icon: require('../../assets/images/survy.png') },
  orders:          { tabFile: 'Orders',          path: '/(tabs)/Orders',          label: 'ORDERS',   icon: require('../../assets/images/orders.png') },

  // ── Provider tabs ──────────────────────────────────────────────────
  providerDash:    { tabFile: 'ProviderDash',    path: '/(tabs)/ProviderDash',    label: 'OVERVIEW', icon: require('../../assets/images/dashboard.png') },
  chats:           { tabFile: 'Chats',           path: '/(tabs)/Chats',           label: 'CHATS',    icon: require('../../assets/images/chats.png') },
  schedule:        { tabFile: 'ProviderAccount',path: '/(tabs)/ProviderAccount',label: 'SCHEDULE', icon: require('../../assets/images/schedule.png') },

  // ── Account tabs (one per auth state) ─────────────────────────────
  // ✏️  Once you create UserAccount.tsx and ProviderAccount.tsx inside
  //     app/(tabs)/, update the tabFile and path values below.
  //     Until then they both fall back to UserLogin.
  loginPage:       { tabFile: 'UserLogin',       path: '/(tabs)/UserLogin',       label: 'ACCOUNT',  icon: require('../../assets/images/account.png') },
  userAccount:     { tabFile: 'UserLogin',       path: '/(tabs)/UserLogin',       label: 'ACCOUNT',  icon: require('../../assets/images/account.png') },
  providerAccount: { tabFile: 'UserLogin', path: '/(tabs)/UserLogin',       label: 'ACCOUNT',  icon: require('../../assets/images/account.png') },
} as const;

// ─────────────────────────────────────────────────────────────────────
// ✏️  EDIT YOUR TAB ORDERS HERE
// List which keys (from ROUTES above) appear for each role, left → right.
// ─────────────────────────────────────────────────────────────────────
const TAB_ORDER = {
  guest:    ['home', 'survy', 'orders', 'loginPage'      ] as const,
  user:     ['home', 'survy', 'orders', 'userAccount'    ] as const,
  provider: ['providerDash', 'chats', 'schedule', 'providerAccount'] as const,
};

// ─── Types & helpers (no need to edit below this line) ───────────────

type RouteKey = keyof typeof ROUTES;

function getTabsForRole(role: string | null): RouteKey[] {
  if (role === 'provider') return [...TAB_ORDER.provider];
  if (role === 'user')     return [...TAB_ORDER.user];
  return [...TAB_ORDER.guest];
}

// Returns true if pressing this tab should be intercepted (path ≠ tabFile location)
function isIntercepted(key: RouteKey): boolean {
  const r = ROUTES[key];
  return !r.path.includes(r.tabFile);
}

// ─── Custom Animated Tab Bar ──────────────────────────────────────────
function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const { role } = useAuth();
  const pathname = usePathname();
  const { role } = useAuth();
  const router = useRouter();

  const activeTabs         = getTabsForRole(role);
  // Collect unique tabFile names for this role (deduped — user/providerAccount
  // may share 'UserLogin' while the real files don't exist yet)
  const visibleTabFiles    = [...new Set(activeTabs.map(k => ROUTES[k].tabFile))];

  const isHomePage    = pathname === '/' || pathname === '/index';
  const isDarkbgPage  =
      pathname.includes('UserLogin') ||
      pathname.includes('UserAccount') ||
      pathname.includes('ProviderAccount') ||
      pathname.includes('Orders') ||
      pathname.includes('ProviderDash') ||
      pathname.includes('ProviderSchedule') ||
      pathname.includes('Chats');

  const activeTintColor   = '#000000';
  const inactiveTintColor = isDarkbgPage ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const isFullWidth = isHomePage || (role === 'provider' && pathname.includes('ProviderDash'));
  const anim = useRef(new Animated.Value(isFullWidth ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFullWidth ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [isFullWidth]);

  const animBottom         = anim.interpolate({ inputRange: [0, 1], outputRange: [Platform.OS === 'ios' ? 20 : 22, -5] });
  const animLeft           = anim.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });
  const animRight          = anim.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });
  const animBorderRadius   = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 20] });
  const animHeight         = anim.interpolate({ inputRange: [0, 1], outputRange: [Platform.OS === 'ios' ? 72 : 68, Platform.OS === 'ios' ? 90 : 80] });
  const animBorderTopWidth = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const borderColor        = isDarkbgPage ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)';

  const visibleRoutes = state.routes.filter((r: any) => visibleTabFiles.includes(r.name));

  // Find the ROUTES config entry whose tabFile matches a screen name
  const configForTabFile = (tabFile: string) => {
    // Prefer the key that matches the current role's tab list
    const key = activeTabs.find(k => ROUTES[k].tabFile === tabFile);
    return key ? ROUTES[key] : null;
  };

  return (
      <Animated.View
          style={[
            styles.tabBarOuter,
            {
              bottom: animBottom, left: animLeft, right: animRight,
              height: animHeight, borderRadius: animBorderRadius,
              borderTopWidth: animBorderTopWidth, borderColor,
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1, shadowRadius: 12,
            },
          ]}
      >
        <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={25}
            tint="light"
            style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: 'transparent' }]}
        />

        <View style={styles.tabRow}>
          {visibleRoutes.map((route: any) => {
            const idx       = state.routes.findIndex((r: any) => r.key === route.key);
            const focused   = state.index === idx;
            const config    = configForTabFile(route.name);
            const tintColor = focused ? activeTintColor : inactiveTintColor;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

            return (
                <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={focused ? { selected: true } : {}}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={styles.tabItem}
                    activeOpacity={0.7}
                >
                  <Image
                      source={config?.icon}
                      style={{ width: 24, height: 24, tintColor }}
                      resizeMode="contain"
                  />
                  <Text style={[styles.tabLabel, { color: tintColor }]}>
                    {config?.label ?? route.name}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
  );
}

// ─── Main Tab Layout ──────────────────────────────────────────────────
export default function TabLayout() {
  const router = useRouter();
  const { role } = useAuth();

  return (
      <Tabs
          tabBar={(props) => <AnimatedTabBar {...props} />}
          screenOptions={{ headerShown: false }}
      >
        {/* HOME */}
        <Tabs.Screen
            name={ROUTES.home.tabFile}
            listeners={() => ({
              tabPress: (e) => {
                if (role === 'provider') {
                  e.preventDefault();
                  router.replace(ROUTES.providerDash.path);
                }
              },
            })}
            options={{ href: role === 'provider' ? null : undefined }}
        />

        {/* SURVY — tabFile is Survy.tsx but navigates to /AiPage */}
        <Tabs.Screen
            name={ROUTES.survy.tabFile}
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push(ROUTES.survy.path);
              },
            })}
            options={{ href: role === 'provider' ? null : undefined }}
        />

        {/* ORDERS */}
        <Tabs.Screen
            name={ROUTES.orders.tabFile}
            options={{ href: role === 'provider' ? null : undefined }}
        />

        {/* PROVIDER DASHBOARD */}
        <Tabs.Screen
            name={ROUTES.providerDash.tabFile}
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push(ROUTES.providerDash.path);
              },
            })}
            options={{ href: role !== 'provider' ? null : undefined }}
        />

        {/* CHATS */}
        <Tabs.Screen
            name={ROUTES.chats.tabFile}
            options={{ href: role !== 'provider' ? null : undefined }}
        />

        {/* SCHEDULE */}
        <Tabs.Screen
            name={ROUTES.schedule.tabFile}
            options={{ href: role !== 'provider' ? null : undefined }}
        />

        {/* ACCOUNT — currently all three states point to UserLogin.
          When you create UserAccount.tsx / ProviderAccount.tsx in (tabs)/,
          update the tabFile + path in ROUTES above and uncomment the two
          screens below. */}
        <Tabs.Screen
            name={ROUTES.loginPage.path}
            options={{ href: role !== null ? null : undefined }}
        />

        {/* <Tabs.Screen
        name={ROUTES.userAccount.tabFile}
        options={{ href: role !== 'user' ? null : undefined }}
      /> */}

        {/* <Tabs.Screen
        name={ROUTES.providerAccount.tabFile}
        options={{ href: role !== 'provider' ? null : undefined }}
      /> */}

        {/* ALERTS & DASH — registered so Expo Router doesn't complain,
          but hidden from the tab bar */}
        <Tabs.Screen name="Alerts" options={{ href: null }} />
        <Tabs.Screen name="dash"   options={{ href: null }} />
      </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    elevation: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : -2,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -1,
    marginBottom: Platform.OS === 'ios' ? 6 : 10,
    letterSpacing: 0.3,
  },
});
