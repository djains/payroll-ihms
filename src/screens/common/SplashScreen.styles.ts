import { StyleSheet, Platform } from 'react-native';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2', // Warm Ivory Cream matching reference screenshot
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  topSpacer: {
    height: ms(20),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // Soft Pastel Buttercup Squircle Badge
  emblemBadge: {
    width: ms(86),
    height: ms(86),
    borderRadius: ms(26),
    backgroundColor: '#FDF1C8', // Buttercup pastel from Withdraw card
    borderWidth: 1,
    borderColor: '#EFE3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },

  // Razor-sharp 1.8px Vector Line Crest
  vectorShield: {
    width: ms(42),
    height: ms(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldOutline: {
    width: ms(38),
    height: ms(44),
    borderWidth: 2,
    borderColor: '#111827',
    borderTopLeftRadius: ms(19),
    borderTopRightRadius: ms(19),
    borderBottomLeftRadius: ms(22),
    borderBottomRightRadius: ms(22),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shieldCheck: {
    width: ms(14),
    height: ms(8),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#111827',
    transform: [{ rotate: '-45deg' }, { translateY: -ms(2) }],
  },

  // Editorial Modern Serif Title (Matching $1,642.20 style)
  appTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: ms(30),
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: ms(6),
  },
  appSubtitle: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: ms(10),
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  // Minimalist Pastel Badges
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  pillIcon: {
    marginRight: ms(5),
  },
  pillText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#111827',
  },

  // Bottom Loading Indicator
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '70%',
    height: ms(3),
    backgroundColor: '#EAE5D9',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111827', // Crisp charcoal black matching screenshot
    borderRadius: borderRadius.full,
  },
  statusMessage: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: fontSizes.xs,
    fontWeight: '500',
    marginBottom: ms(2),
  },
  versionText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: '#9CA3AF',
    marginTop: ms(2),
  },
});
