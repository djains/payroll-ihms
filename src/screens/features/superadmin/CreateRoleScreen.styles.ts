import { StyleSheet, Platform } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: ms(40),
    backgroundColor: '#F8FAFC',
  },

  // ── Flush Top Header Bar ──
  topHeaderBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? ms(10) : ms(14),
    paddingBottom: ms(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...shadows.sm,
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    flex: 1,
  },
  backIconButton: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleText: {
    fontSize: fontSizes.md + 1,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '600',
    color: '#64748B',
    marginTop: ms(1),
  },
  headerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
  },
  headerBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    color: '#B45309',
  },

  contentWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardSectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: ms(2),
  },
  cardSectionSub: {
    fontSize: fontSizes.xxs + 0.5,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: spacing.md,
  },

  // Levels Grid
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
    marginBottom: spacing.md,
  },
  levelPill: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(8),
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  levelPillText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#475569',
  },
  levelPillTextActive: {
    color: '#FFFFFF',
  },

  buttonWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
  },
});
