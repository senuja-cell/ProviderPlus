import React, { useEffect, useRef } from 'react';
import { Image, View, StyleSheet, Platform, Animated, TouchableOpacity, Text } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from './../context/AuthContext';

// ─── Tab config per role ──────────────────────────────────────────────
//  null (guest) →  index · Survy · Orders · UserLogin
//  user         →  index · Survy · Orders · UserAccount
//  provider     →  ProviderDash · Chats · ProviderSchedule · ProviderAccount
//  admin        →  PendingProviders · UserLogin
// ─────────────────────────────────────────────────────────────────────
const GUEST_TABS    = ['index', 'Survy', 'Orders', 'UserLogin']                                    as const;
const USER_TABS     = ['index', 'Survy', 'Orders', 'UserAccount']                                  as const;
const PROVIDER_TABS = ['ProviderDash', 'Chats', 'ProviderSchedule', 'ProviderAccount']             as const;
const ADMIN_TABS    = ['PendingProviders', 'UserAccount']                                             as const;

const ICON_MAP: Record<string, any> = {
  index:            require('../../assets/images/home.png'),
  Survy:            require('../../assets/images/survy.png'),
  Orders:           require('../../assets/images/orders.png'),
  UserLogin:        require('../../assets/images/account.png'),
  UserAccount:      require('../../assets/images/account.png'),
  ProviderDash:     require('../../assets/images/dashboard.png'),
  Chats:            require('../../assets/images/chats.png'),
  ProviderSchedule: require('../../assets/images/schedule.png'),
  ProviderAccount:  require('../../assets/images/account.png'),
  PendingProviders: require('../../assets/images/dashboard.png'),
};

const LABEL_MAP: Record<string, string> = {
  index:            'HOME',
  Survy:            'SURVY',
  Orders:           'ORDERS',
  UserLogin:        'ACCOUNT',
  UserAccount:      'ACCOUNT',
  ProviderDash:     'OVERVIEW',
  Chats:            'CHATS',
  ProviderSchedule: 'SCHEDULE',
  ProviderAccount:  'ACCOUNT',
  PendingProviders: 'PENDING',
};

// ─── Custom Animated Tab Bar ──────────────────────────────────────────
function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const { role, isLoading } = useAuth();
  const pathname = usePathname();

  const visibleTabs: readonly string[] =
      role === 'provider' ? PROVIDER_TABS :
          role === 'user'     ? USER_TABS     :
              role === 'admin'    ? ADMIN_TABS    :
                  GUEST_TABS;

  const isHomePage   = pathname === '/' || pathname === '/index';
  const isDarkbgPage =
      pathname.includes('UserLogin')        ||
      pathname.includes('UserAccount')      ||
      pathname.includes('ProviderAccount')  ||
      pathname.includes('Orders')           ||
      pathname.includes('ProviderDash')     ||
      pathname.includes('ProviderSchedule') ||
      pathname.includes('PendingProviders') ||
      pathname.includes('Chats');

  const activeTintColor   = '#000000';
  const inactiveTintColor = isDarkbgPage ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const isFullWidth =
      isHomePage ||
      (role === 'provider' && pathname.includes('ProviderDash')) ||
      (role === 'admin'    && pathname.includes('PendingProviders'));

  // All hooks must be declared before any early return
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

  // Early return AFTER all hooks
  if (isLoading) return null;

  const visibleRoutes = state.routes.filter((r: any) => visibleTabs.includes(r.name));

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
                      source={ICON_MAP[route.name]}
                      style={{ width: 24, height: 24, tintColor }}
                      resizeMode="contain"
                  />
                  <Text style={[styles.tabLabel, { color: tintColor }]}>
                    {LABEL_MAP[route.name] ?? route.name}
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
  const { role, isLoading } = useAuth();

  // When role is cleared by signOut(), redirect to login and reset nav stack
  useEffect(() => {
    if (!isLoading && role === null) {
      router.replace('/UserLogin');
    }
  }, [role, isLoading]);

  return (
      <Tabs
          tabBar={(props) => <AnimatedTabBar {...props} />}
          screenOptions={{ headerShown: false }}
      >
        {/* All screens registered once — AnimatedTabBar controls visibility */}

        <Tabs.Screen
            name="index"
            listeners={() => ({
              tabPress: (e) => {
                if (role === 'provider' || role === 'admin') {
                  e.preventDefault();
                  router.replace(role === 'admin' ? '/PendingProviders' : '/ProviderDash');
                }
              },
            })}
        />

        <Tabs.Screen
            name="Survy"
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push('/AiPage');
              },
            })}
        />

        <Tabs.Screen name="Orders" />

        <Tabs.Screen name="UserAccount" />

        <Tabs.Screen
            name="ProviderDash"
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push('/ProviderDash');
              },
            })}
        />

        <Tabs.Screen name="Chats" />

        <Tabs.Screen name="ProviderSchedule" />

        <Tabs.Screen name="ProviderAccount" />

        <Tabs.Screen
            name="PendingProviders"
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push('/PendingProviders');
              },
            })}
        />

        <Tabs.Screen name="UserLogin" />

        {/* Hidden — registered so Expo Router doesn't complain */}
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
