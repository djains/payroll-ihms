import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ms } from '../../theme/responsive';

/**
 * Global Real-time Network Connectivity & Offline Mode Banner
 * Powered by @react-native-community/netinfo
 * 
 * - Detects true network reachability (Wi-Fi, cellular, offline)
 * - Slides down sleek warning banner when connection drops
 * - Smoothly transitions to green 'Back Online' banner on recovery and auto-dismisses
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const wasOfflineRef = useRef<boolean>(false);
  const translateY = useRef(new Animated.Value(-120)).current;
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12);

  useEffect(() => {
    // 1. Initial network state check on mount
    NetInfo.fetch().then((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (!online) {
        wasOfflineRef.current = true;
        slideDown();
      }
    });

    // 2. Real-time active connection change listener
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);

      if (!online) {
        wasOfflineRef.current = true;
        setIsOnline(false);
        setShowRestored(false);
        slideDown();
      } else {
        if (wasOfflineRef.current) {
          // Recovered from offline mode!
          setIsOnline(true);
          setShowRestored(true);
          slideDown();

          // Auto-hide restored notification after 3 seconds
          const timer = setTimeout(() => {
            slideUp(() => {
              setShowRestored(false);
              wasOfflineRef.current = false;
            });
          }, 3000);
          return () => clearTimeout(timer);
        } else {
          setIsOnline(true);
          slideUp();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const slideDown = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 9,
    }).start();
  };

  const slideUp = (callback?: () => void) => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
    });
  };

  // If online and not showing the restored message, don't render
  if (isOnline && !showRestored) {
    return null;
  }

  const isRestored = isOnline && showRestored;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          paddingTop: topInset + ms(4),
          backgroundColor: isRestored ? '#10B981' : '#EF4444',
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.contentRow}>
        <Text style={styles.iconText}>{isRestored ? '✓' : '⚡'}</Text>
        <Text style={styles.bannerText}>
          {isRestored
            ? 'Back Online • Internet Connected'
            : 'No Internet Connection • Working in Offline Mode'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    paddingBottom: ms(8),
    paddingHorizontal: ms(16),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
  },
  iconText: {
    fontSize: ms(13),
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bannerText: {
    fontSize: ms(12),
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});

