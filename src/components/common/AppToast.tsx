import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, ToastType } from '../../store/toastStore';
import { styles } from './AppToast.styles';
import { colors } from '../../theme/colors';
import { ms } from '../../theme';

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        pillBg: '#15803D',
        iconSymbol: '✓',
      };
    case 'error':
      return {
        pillBg: '#DC2626',
        iconSymbol: '✕',
      };
    case 'warning':
      return {
        pillBg: '#D97706',
        iconSymbol: '!',
      };
    case 'info':
    default:
      return {
        pillBg: '#0F172A',
        iconSymbol: 'ℹ',
      };
  }
};

export const AppToast: React.FC = () => {
  const { activeToast, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Extra top offset to safely clear camera punch-hole / notch on all phones
  const safeTop = Math.max(insets.top + ms(12), Platform.OS === 'android' ? ms(48) : ms(54));

  useEffect(() => {
    if (activeToast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeToast, translateY, opacity]);

  if (!activeToast) {
    return null;
  }

  const { pillBg, iconSymbol } = getToastConfig(activeToast.type);
  const displayText = activeToast.message || activeToast.title || '';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: safeTop,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[styles.toastPill, { backgroundColor: pillBg }]}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{iconSymbol}</Text>
        </View>

        <Text style={styles.toastText}>
          {displayText}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
