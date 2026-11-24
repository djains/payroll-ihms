import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, ToastType, ToastConfig } from '../../store/toastStore';
import { styles } from './AppToast.styles';
import { AppIcon } from './AppIcon';
import { ms } from '../../theme';

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        pillBg: '#15803D',
        iconName: 'checkmark',
      };
    case 'error':
      return {
        pillBg: '#DC2626',
        iconName: 'close',
      };
    case 'warning':
      return {
        pillBg: '#D97706',
        iconName: 'warning',
      };
    case 'info':
    default:
      return {
        pillBg: '#0F172A',
        iconName: 'info',
      };
  }
};

export const AppToast: React.FC = () => {
  const { activeToast, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [displayedToast, setDisplayedToast] = useState<ToastConfig | null>(activeToast);

  // Extra top offset to safely clear camera punch-hole / notch on all phones
  const safeTop = Math.max(insets.top + ms(12), Platform.OS === 'android' ? ms(48) : ms(54));

  useEffect(() => {
    if (activeToast) {
      setDisplayedToast(activeToast);
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
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setDisplayedToast(null);
        }
      });
    }
  }, [activeToast, translateY, opacity]);

  if (!displayedToast) {
    return null;
  }

  const { pillBg, iconName } = getToastConfig(displayedToast.type);
  const displayText = displayedToast.message || displayedToast.title || '';

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
          <AppIcon name={iconName} size={11} color="#FFFFFF" />
        </View>

        <Text style={styles.toastText}>
          {displayText}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
