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
    paddingVertical: ms(20),
    backgroundColor: '#FAF8F2', // Warm Ivory Cream
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  // Branding Header (Centered & Clean)
  brandingHeader: {
    alignItems: 'center',
    marginBottom: ms(16),
  },
  heroTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: ms(26),
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    ...typography.caption,
    color: '#64748B',
    fontSize: ms(9.5),
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: ms(3),
  },

  // Login Card
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    paddingHorizontal: ms(22),
    paddingTop: ms(26),
    paddingBottom: ms(24),
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
  legalSection: {
    marginTop: ms(18),
  },
  legalDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  legalDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  legalDividerLabel: {
    fontSize: ms(8.5),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginHorizontal: ms(8),
  },
  legalCardsContainer: {
    gap: ms(8),
  },
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    ...shadows.sm,
  },
  privacyIconBadge: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  termsIconBadge: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  legalCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  legalCardTitle: {
    fontSize: ms(12.5),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: ms(1.5),
  },
  legalCardSubtitle: {
    fontSize: ms(10),
    fontWeight: '500',
    color: '#64748B',
  },
  legalArrowBadge: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ms(8),
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(14),
  },
  termsNote: {
    ...typography.caption,
    fontSize: ms(9.5),
    color: '#6B7280',
    textAlign: 'center',
  },
  termsLink: {
    ...typography.caption,
    fontSize: ms(9.5),
    color: '#0F172A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: ms(12),
    paddingVertical: ms(5),
    paddingHorizontal: ms(12),
    backgroundColor: '#F3F4F6',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalBadgeText: {
    ...typography.caption,
    fontSize: ms(10),
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: ms(5),
  },
  footerNote: {
    ...typography.caption,
    fontSize: ms(9.5),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: ms(6),
  },
});
