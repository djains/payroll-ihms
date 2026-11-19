import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: ms(40),
  },

  // ── Step Indicator Progress Bar ──
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  stepItem: {
    alignItems: 'center',
    gap: ms(4),
  },
  stepBadge: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBadgeActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  stepBadgeDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#64748B',
  },
  stepBadgeTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: ms(8),
    marginBottom: ms(14),
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },

  // ── Form Cards ──
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(18),
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginBottom: ms(12),
    paddingBottom: ms(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardIconCircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardSectionSub: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '500',
    color: '#64748B',
    marginTop: ms(2),
  },

  // 2-Col Input Row
  inputRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  inputCol: {
    flex: 1,
  },

  // Navigation Buttons Row (Back + Next/Submit)
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  prevButton: {
    flex: 1,
    paddingVertical: ms(14),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  prevButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#475569',
  },
  nextButton: {
    flex: 2,
    paddingVertical: ms(14),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    ...shadows.sm,
  },
  nextButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
