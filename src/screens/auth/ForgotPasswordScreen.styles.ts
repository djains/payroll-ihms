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
    backgroundColor: '#FAF8F2', // Matching Warm Ivory Cream
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  // Compact Header
  headerWrap: {
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
  heroTitle: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: ms(24),
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E8E5DF',
    ...shadows.md,
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(10),
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(6),
    marginBottom: ms(8),
    borderLeftWidth: ms(3),
    borderLeftColor: '#0F172A',
  },
  instructionsText: {
    ...typography.body2,
    color: '#475569',
    fontSize: ms(9.5),
    lineHeight: ms(14),
  },
  inputItem: {
    marginBottom: ms(8),
  },
  errorText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: fontSizes.xs,
    marginBottom: ms(8),
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: ms(12),
    minHeight: ms(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(4),
    ...shadows.sm,
  },
  cancelButton: {
    marginTop: ms(8),
    paddingVertical: ms(6),
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  footerNote: {
    ...typography.caption,
    fontSize: ms(9.5),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: ms(8),
  },
});
