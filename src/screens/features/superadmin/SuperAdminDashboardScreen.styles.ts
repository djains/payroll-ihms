import { StyleSheet, Dimensions } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = ms(10);
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - GRID_GAP * 2) / 3;

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerProfileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ms(10),
    gap: ms(10),
  },
  avatarCircle: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fontSizes.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  greetingSubtitle: {
    fontSize: fontSizes.xs,
    color: '#0D9488',
    fontWeight: '700',
    marginTop: ms(1),
  },
  logoutButton: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // KPI Overview Grid (2x2 equal fit square grid)
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  kpiTile: {
    width: (SCREEN_WIDTH - spacing.md * 2 - ms(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    paddingHorizontal: ms(12),
    paddingVertical: ms(12),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
    gap: ms(4),
  },
  kpiLabel: {
    flex: 1,
    fontSize: ms(10.5),
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  kpiIconDot: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiValue: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  kpiSubtext: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: ms(2),
  },

  // Section Header
  sectionHeaderTitle: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  // 3-Column Square Cards Grid (Exact matching UnifiedDashboardScreen)
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: spacing.md,
  },
  featureCard: {
    width: CARD_WIDTH,
    minHeight: CARD_WIDTH + ms(10),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    paddingHorizontal: ms(6),
    paddingVertical: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  cardIconWrap: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(5),
  },
  cardTitle: {
    fontSize: fontSizes.xs - 0.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: ms(14),
    paddingHorizontal: ms(2),
  },
  cardBadgeValue: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: ms(3),
    textAlign: 'center',
  },
});
