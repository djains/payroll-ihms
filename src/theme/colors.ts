/**
 * Global Color Palette
 * Enterprise Dark Slate theme with neutral surfaces, accessible text colors,
 * semantic states (success, danger, warning, info), and dynamic tenant theme support.
 */

export interface ThemeColors {
  // Brand & Accent (Dynamically customizable per company)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;

  // Backgrounds & Surfaces
  background: string;
  surface: string;
  surfaceVariant: string;
  cardBackground: string;
  modalBackground: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  borderFocus: string;

  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Semantic Status Colors
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  // Neo-Fintech Pastel Palette
  pastelMint: string;
  pastelYellow: string;
  pastelPeach: string;
  accentYellow: string;

  // Attendance Status Badge Colors
  statusPresent: string;
  statusAbsent: string;
  statusLeave: string;
  statusWeeklyOff: string;

  // Overlays
  overlay: string;
  shimmer: string;
}

export const defaultColors: ThemeColors = {
  // Brand Defaults (Neo-Fintech Warm Ivory & Crisp Accents)
  primary: '#111827',         // Rich Charcoal Black
  primaryLight: '#374151',
  primaryDark: '#030712',
  accent: '#F59E0B',          // Amber 500
  accentLight: '#FEF3C7',     // Amber 100

  // Surfaces (Warm Ivory / Cream like Cash App & Fold)
  background: '#FAF8F2',      // Warm Cream Ivory
  surface: '#FFFFFF',         // Pure White
  surfaceVariant: '#F3EFE6',  // Warm Off-White
  cardBackground: '#FFFFFF',
  modalBackground: '#FFFFFF',

  // Pastel Quick Action Tints
  pastelMint: '#CEECE6',      // Mint Teal
  pastelYellow: '#FDF1C8',    // Buttercup Yellow
  pastelPeach: '#FCDDC7',     // Peach Salmon
  accentYellow: '#F5BE18',    // Bold Accent Yellow

  // Borders
  border: '#E8E3D7',          // Warm Subtle Border
  borderLight: '#F0ECE1',     // Soft Border
  borderFocus: '#111827',     // Dark Focus

  // Text
  textPrimary: '#111827',     // Pure Clean Black
  textSecondary: '#6B7280',   // Slate Muted 600
  textMuted: '#9CA3AF',       // Soft Gray 400
  textInverse: '#FFFFFF',

  // Semantic
  success: '#10B981',         // Emerald 500
  successLight: '#D1FAE5',    // Emerald 100
  danger: '#EF4444',          // Red 500
  dangerLight: '#FEE2E2',     // Red 100
  warning: '#F59E0B',         // Amber 500
  warningLight: '#FEF3C7',    // Amber 100
  info: '#3B82F6',            // Blue 500
  infoLight: '#DBEAFE',       // Blue 100

  // Attendance Statuses (From PDF specifications)
  statusPresent: '#10B981',   // Green
  statusAbsent: '#EF4444',    // Red
  statusLeave: '#F59E0B',     // Yellow
  statusWeeklyOff: '#3B82F6', // Blue

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.6)',
  shimmer: '#E2E8F0',
};

/**
 * Creates dynamic colors by injecting company-specific brand colors
 */
export const createCompanyTheme = (customPrimary?: string, customAccent?: string): ThemeColors => {
  return {
    ...defaultColors,
    primary: customPrimary || defaultColors.primary,
    accent: customAccent || defaultColors.accent,
  };
};

export const colors = defaultColors;
