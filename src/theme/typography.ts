import { Platform, TextStyle } from 'react-native';
import { ms } from './responsive';

/**
 * Global Font Family Configurations
 * Cross-platform compatible with iOS San Francisco / Android Roboto fallbacks,
 * ready to support custom font assets (e.g. Inter / Outfit / Poppins).
 */
export const fontFamilies = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif-medium',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif-medium',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif-bold',
    default: 'sans-serif-bold',
  }),
};

/**
 * Scaled Font Sizes using moderate scale (ms)
 */
export const fontSizes = {
  xxs: ms(10),
  xs: ms(12),
  sm: ms(14),
  md: ms(16),
  lg: ms(18),
  xl: ms(20),
  xxl: ms(24),
  display: ms(30),
  hero: ms(36),
};

/**
 * Line Heights corresponding to font sizes
 */
export const lineHeights = {
  xxs: ms(14),
  xs: ms(16),
  sm: ms(20),
  md: ms(24),
  lg: ms(26),
  xl: ms(28),
  xxl: ms(32),
  display: ms(38),
  hero: ms(44),
};

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

/**
 * Pre-composed Typography Presets
 */
export const typography = {
  // Headings
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.hero,
    lineHeight: lineHeights.hero,
    fontWeight: fontWeights.bold,
  } as TextStyle,
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: fontWeights.bold,
  } as TextStyle,
  h3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    fontWeight: fontWeights.semiBold,
  } as TextStyle,
  h4: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semiBold,
  } as TextStyle,

  // Subtitles
  subtitle1: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.medium,
  } as TextStyle,
  subtitle2: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Body text
  body1: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  body2: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Captions & Badges
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  button: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.semiBold,
  } as TextStyle,
  badge: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Convenience Aliases
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semiBold,
  } as TextStyle,
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.medium,
  } as TextStyle,
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  bodyBold: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.bold,
  } as TextStyle,
  captionBold: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.bold,
  } as TextStyle,
};
