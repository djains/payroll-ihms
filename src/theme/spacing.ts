import { Platform, ViewStyle } from 'react-native';
import { ms } from './responsive';

/**
 * Scaled Spacing Tokens (Padding & Margins)
 */
export const spacing = {
  none: 0,
  xxs: ms(2),
  xs: ms(4),
  sm: ms(8),
  md: ms(16),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(40),
  section: ms(48),
};

/**
 * Scaled Border Radius Tokens
 */
export const borderRadius = {
  none: 0,
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(24),
  full: 9999,
};

/**
 * Cross-Platform Elevation & Shadows
 */
export const shadows = {
  none: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  } as ViewStyle,

  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }) as ViewStyle,
};
