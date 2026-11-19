import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: ms(6),
    paddingBottom: ms(90),
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  // Super Admin Workspace Preview Banner
  adminPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF1C8',
    borderWidth: 1,
    borderColor: '#EFE3B8',
    borderRadius: ms(14),
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    marginBottom: ms(10),
  },
  adminPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ms(8),
  },
  adminPreviewDot: {
    fontSize: ms(12),
    marginRight: ms(5),
  },
  adminPreviewText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: '#6B7280',
    fontWeight: '600',
  },
  adminPreviewCompany: {
    color: '#111827',
    fontWeight: '800',
  },
  adminExitBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: ms(8),
  },
  adminExitBtnText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: ms(40),
    height: ms(40),
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  notificationBadge: {
    position: 'absolute',
    top: -ms(4),
    right: -ms(4),
    backgroundColor: '#EA580C',
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: ms(10),
    fontWeight: '800',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginTop: ms(10),
    marginBottom: ms(20),
  },
  cashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: ms(4),
  },
  cashDot: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(6),
  },
  cashDotText: {
    color: '#FFFFFF',
    fontSize: ms(11),
    fontWeight: '800',
  },
  cashLabel: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: ms(50),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginVertical: ms(2),
  },
  accountLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(4),
  },
  accountLinkText: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    color: '#4B5563',
    fontWeight: '600',
    marginRight: ms(4),
  },

  // 3 Pastel Squircle Quick Action Cards
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(24),
  },
  actionCard: {
    width: '31.5%',
    aspectRatio: 1.05,
    borderRadius: ms(18),
    padding: ms(12),
    justifyContent: 'space-between',
  },
  actionCardTop: {
    alignSelf: 'flex-end',
  },
  diagonalArrowDown: {
    fontSize: ms(24),
    fontWeight: '800',
    color: '#111827',
  },
  diagonalArrowUp: {
    fontSize: ms(24),
    fontWeight: '800',
    color: '#111827',
  },
  swapIcon: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#111827',
  },
  actionCardLabel: {
    ...typography.subtitle2,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#111827',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(10),
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBadge: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(6),
  },
  sectionIconText: {
    fontSize: ms(11),
  },
  sectionTitle: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  sectionRightMeta: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    color: '#4B5563',
    fontWeight: '500',
  },

  // 2-Column Metric Cards
  twoColumnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(18),
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: ms(14),
    borderWidth: 1,
    borderColor: '#EFECE4',
    ...shadows.sm,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
  },
  metricCardTitle: {
    ...typography.caption,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#111827',
  },
  metricCardValue: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#111827',
    marginBottom: ms(2),
  },
  metricCardUnit: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  metricCardSubtext: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Banner Card
  bannerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#EFECE4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(20),
    overflow: 'hidden',
    ...shadows.sm,
  },
  bannerContent: {
    flex: 1,
    marginRight: ms(12),
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  bannerBadgeText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#059669',
    marginLeft: ms(4),
  },
  bannerTitle: {
    ...typography.subtitle1,
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#111827',
    marginBottom: ms(2),
  },
  bannerDesc: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    color: '#6B7280',
    lineHeight: ms(16),
    marginBottom: ms(8),
  },
  bannerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLinkText: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#111827',
    marginRight: ms(4),
  },
  bannerPillArt: {
    width: ms(70),
    height: ms(70),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniArtCard: {
    width: ms(48),
    height: ms(32),
    borderRadius: ms(6),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  miniArtText: {
    color: '#FFFFFF',
    fontSize: ms(10),
    fontWeight: '900',
  },
});
