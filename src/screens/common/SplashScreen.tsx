import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StatusBar, Platform } from 'react-native';
import { styles } from './SplashScreen.styles';
import { AppIcon } from '../../components/common/AppIcon';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 1800,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [statusMessage, setStatusMessage] = useState('Initializing secure workspace...');

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDuration,
      useNativeDriver: false,
    }).start();

    const t1 = setTimeout(() => {
      setStatusMessage('Verifying device credentials...');
    }, minDuration * 0.35);

    const t2 = setTimeout(() => {
      setStatusMessage('Syncing workforce tenant...');
    }, minDuration * 0.7);

    const t3 = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, minDuration + 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [fadeAnim, scaleAnim, progressAnim, minDuration, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        {...(Platform.OS === 'android' ? ({ backgroundColor: '#FAF8F2' } as any) : {})}
      />

      {/* Top spacing */}
      <View style={styles.topSpacer} />

      {/* Center Branding (Neo-Fintech Editorial Style) */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Pastel Squircle Emblem Badge (Matching Quick-Action Pastel from image) */}
        <View style={styles.emblemBadge}>
          <View style={styles.vectorShield}>
            <View style={styles.shieldOutline}>
              <View style={styles.shieldCheck} />
            </View>
          </View>
        </View>

        {/* Editorial Modern Serif Title (Matching $1,642.20 style) */}
        <Text 
          style={styles.appTitle} 
          numberOfLines={1} 
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          IH&MS-Payroll
        </Text>
        <Text style={styles.appSubtitle}>
          WORKFORCE & MULTI-COMPANY PLATFORM
        </Text>

     
      </Animated.View>

      {/* Bottom Loading Indicator (Minimal, Clean, Unobtrusive) */}
      <View style={styles.footer}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.statusMessage}>{statusMessage}</Text>
        <Text style={styles.versionText}>v2.0 • Secured Workspace</Text>
      </View>
    </View>
  );
};
