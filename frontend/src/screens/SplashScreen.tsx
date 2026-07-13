import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timeoutId = setTimeout(onFinish, 3000);
    return () => clearTimeout(timeoutId);
  }, [fadeValue, onFinish, scaleValue]);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <Animated.View style={[styles.content, { opacity: fadeValue, transform: [{ scale: scaleValue }] }]}>
        <View style={styles.logoShell}>
          <Image source={require('../../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Monitor Anemia AI</Text>
        <Text style={styles.subtitle}>Atención infantil con un flujo ágil, claro y preparado para campo.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.7,
    top: -80,
    right: -70,
  },
  backgroundGlowSecondary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.accentLight,
    opacity: 0.6,
    bottom: -90,
    left: -60,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoShell: {
    width: 164,
    height: 164,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    marginBottom: 24,
  },
  logo: {
    width: 118,
    height: 118,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    maxWidth: 320,
  },
});