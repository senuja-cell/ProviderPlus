import React, { useEffect, useRef } from 'react';
import { Image, View, StyleSheet, Platform, Animated, TouchableOpacity, Text } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from './../context/AuthContext';

// ─── Tab config per role ──────────────────────────────────────────────
//
//  null / 'user'  →  Home · Survy · Alerts · Account
//  'provider'     →  Dashboard · Alerts · Account
//
const USER_TABS = ['index', 'Survy', 'Alerts', 'UserLogin'] as const;
const PROVIDER_TABS = ['ProviderDash', 'Alerts', 'UserLogin'] as const;

const ICON_MAP: Record<string, any> = {
  index:     require('../../assets/images/home.png'),
  Survy:     require('../../assets/images/survy.png'),
  Alerts:    require('../../assets/images/alerts.png'),
  UserLogin: require('../../assets/images/account.png'),
  dash:      require('../../assets/images/home.png'), // replace with a dashboard icon
};

const LABEL_MAP: Record<string, string> = {
  index:     'HOME',
  Survy:     'SURVY',
  Alerts:    'ALERTS',
  UserLogin: 'ACCOUNT',
  dash:      'DASHBOARD',
};

// ─── Custom Animated Tab Bar ─────────────────────────────────────────
function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const { role } = useAuth();
  const pathname = usePathname();

  const isHomePage = pathname === '/' || pathname === '/index';
  const isDarkbgPage = pathname.includes('UserLogin') || pathname.includes('Alerts');

  const activeTintColor = '#0056D2';
  const inactiveTintColor = isDarkbgPage ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  // Determine which tab names are visible for the current role
  const visibleTabs: readonly string[] = role === 'provider' ? PROVIDER_TABS : USER_TABS;

  // Animation: 1 = home/dashboard (full-width), 0 = floating
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

  const animBottom = anim.interpolate({ inputRange: [0, 1], outputRange: [Platform.OS === 'ios' ? 20 : 22, -5] });
  const animLeft = anim.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });
  const animRight = anim.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });
  const animBorderRadius = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 20] });
  const animHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [Platform.OS === 'ios' ? 72 : 68, Platform.OS === 'ios' ? 90 : 80] });
  const animBorderTopWidth = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const borderColor = isDarkbgPage ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)';

  // Filter routes to only those visible for this role
  const visibleRoutes = state.routes.filter((r: any) => visibleTabs.includes(r.name));

  return (
      <Animated.View
          style={[
            styles.tabBarOuter,
            {
              bottom: animBottom,
              left: animLeft,
              right: animRight,
              height: animHeight,
              borderRadius: animBorderRadius,
              borderTopWidth: animBorderTopWidth,
              borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
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
            const index = state.routes.findIndex((r: any) => r.key === route.key);
            const focused = state.index === index;
            const tintColor = focused ? activeTintColor : inactiveTintColor;
            const label = LABEL_MAP[route.name] || route.name;

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
                      source={ICON_MAP[route.name]}
                      style={{ width: 24, height: 24, tintColor }}
                      resizeMode="contain"
                  />
                  <Text style={[styles.tabLabel, { color: tintColor }]}>{label}</Text>
                </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
  );
}

// ─── Main Tab Layout ─────────────────────────────────────────────────
export default function TabLayout() {
  const router = useRouter();
  const { role } = useAuth();

  return (
      <Tabs
          tabBar={(props) => <AnimatedTabBar {...props} />}
          screenOptions={{ headerShown: false }}
      >
        {/* HOME – users only; providers redirect to dashboard */}
        <Tabs.Screen
            name="index"
            listeners={() => ({
              tabPress: (e) => {
                if (role === 'provider') {
                  e.preventDefault();
                  router.replace('/ProviderDash');
                }
              },
            })}
            options={{ title: 'HOME', href: role === 'provider' ? null : undefined }}
        />

        {/* SURVY – users only */}
        <Tabs.Screen
            name="Survy"
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push('/AiPage');
              },
            })}
            options={{ title: 'SURVY', href: role === 'provider' ? null : undefined }}
        />

        {/* DASHBOARD – providers only */}
        <Tabs.Screen
            name="DASHBOARD"
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push('/ProviderDash');
              },
            })}
            options={{ title: 'DASHBOARD', href: role !== 'provider' ? null : undefined }}
        />

        {/* ALERTS – everyone */}
        <Tabs.Screen
            name="Alerts"
            options={{ title: 'ALERTS' }}
        />

        {/* ACCOUNT – everyone */}
        <Tabs.Screen
            name="UserLogin"
            options={{ title: 'ACCOUNT' }}
        />
      </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
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
    marginTop: -4,
    marginBottom: Platform.OS === 'ios' ? 6 : 10,
    letterSpacing: 0.3,
  },
});
