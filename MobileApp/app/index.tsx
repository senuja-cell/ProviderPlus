import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    // Wait until AuthContext has finished reading from AsyncStorage
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (role === 'provider') {
        router.replace('/ProviderDash');
      } else {
        // null (guest) or 'user' both go to the user home
        router.replace('/(tabs)');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, role]); // re-runs once isLoading flips to false

  return (
      <LinearGradient
          colors={['#00C6FF', '#0072FF']}
          style={styles.container}
      >
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>FIND THE BEST.</Text>
          <Text style={styles.titleText}>FOR YOU.</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image
              source={require('../assets/images/provider-logo.png')}
              style={styles.logo}
              resizeMode="contain"
          />
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>ALL RIGHT RESERVED. 2025</Text>
          <Text style={styles.footerText}>PROVIDER+</Text>
        </View>
      </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  textContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  logo: {
    width: 120,
    height: 120,
  },
  footerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default SplashScreen;
