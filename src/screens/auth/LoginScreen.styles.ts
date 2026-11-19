import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#FAF8F2', // Warm Ivory Cream
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  // Branding Header (Centered & Compact)
  brandingHeader: {
    alignItems: 'center',
    marginBottom: ms(10),
  },
  logoBadge: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(15),
    backgroundColor: '#FDF1C8',
    borderWidth: 1,
    borderColor: '#EFE3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(4),
    ...shadows.sm,
  },
  shieldOutline: {
    width: ms(24),
    height: ms(26),
    borderWidth: 2,
    borderColor: '#111827',
    borderTopLeftRadius: ms(12),
    borderTopRightRadius: ms(12),
    borderBottomLeftRadius: ms(13),
    borderBottomRightRadius: ms(13),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shieldCheck: {
    width: ms(9),
    height: ms(5),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#111827',
    transform: [{ rotate: '-45deg' }, { translateY: -ms(1.5) }],
  },
  heroTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: ms(26),
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: ms(8.5),
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: ms(1),
  },

  // Login Card
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    paddingHorizontal: ms(22),
    paddingTop: ms(28),
    paddingBottom: ms(28),
    minHeight: ms(320),
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DF',
    ...shadows.md,
  },

  // 2 Clean Tabs (Login & Admin)
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(12),
    padding: ms(3),
    marginBottom: spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(8),
    borderRadius: ms(9),
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabIconWrap: {
    marginRight: ms(6),
  },
  tabText: {
    ...typography.button,
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  inputItem: {
    marginBottom: ms(12),
  },

  forgotLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: ms(2),
    marginBottom: ms(14),
    paddingVertical: ms(2),
  },
  forgotLinkText: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    color: '#4B5563',
    fontWeight: '600',
    marginRight: ms(4),
  },
  signInButton: {
    backgroundColor: '#111827',
    borderRadius: ms(12),
    minHeight: ms(50),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  footerNote: {
    ...typography.caption,
    fontSize: ms(9.5),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: ms(8),
  },
});
