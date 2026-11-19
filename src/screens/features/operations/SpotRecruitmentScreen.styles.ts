import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(14),
    paddingTop: ms(10),
    paddingBottom: ms(110),
    backgroundColor: '#F8FAFC',
  },

  // ── Enterprise Unit Card with Business Grid ──
  scopeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(14),
    marginBottom: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  scopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(12),
    paddingBottom: ms(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scopeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  scopeIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeHeaderTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scopeHeaderSubtitle: {
    fontSize: fontSizes.xxs + 0.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: ms(1),
  },

  // 2x2 Clean Business Grid
  scopeGrid: {
    gap: ms(8),
  },
  scopeGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  scopeGridCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    paddingHorizontal: ms(10),
    paddingVertical: ms(7),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  scopeGridLabel: {
    fontSize: ms(9),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: ms(2),
  },
  scopeGridValue: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#0F172A',
  },

  // ── Section Card Container ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(14),
    marginBottom: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(12),
    paddingBottom: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionBadge: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: ms(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Labels & Selectors ──
  selectorLabel: {
    fontSize: fontSizes.xxs + 0.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ms(6),
    marginTop: ms(4),
  },

  // Equal 2-Column Responsive Pill Grid
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(12),
  },
  colBtn: {
    flex: 1,
    paddingVertical: ms(10),
    paddingHorizontal: ms(8),
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  colBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  colBtnTextActive: {
    color: '#FFFFFF',
  },

  // Flowing Chips Row
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(7),
    marginBottom: ms(12),
  },
  chipBtn: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: ms(44),
  },
  chipBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // ── Responsive 2x2 Photo Proofs Grid ──
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginBottom: ms(10),
  },
  photoCard: {
    flex: 1,
    paddingVertical: ms(14),
    paddingHorizontal: ms(8),
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
  },
  photoCardAttached: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  photoCardText: {
    fontSize: fontSizes.xxs + 0.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  photoCardTextAttached: {
    color: '#15803D',
  },
  photoCardBadge: {
    fontSize: ms(9),
    fontWeight: '800',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: ms(6),
    paddingVertical: ms(1.5),
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  docThumbnail: {
    width: ms(42),
    height: ms(42),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  retakeText: {
    fontSize: ms(9),
    fontWeight: '700',
    color: '#0284C7',
    marginTop: ms(1),
  },

  // ── Submit Section ──
  submitCard: {
    marginTop: ms(6),
    marginBottom: ms(20),
  },
  submitBtn: {
    height: ms(50),
    borderRadius: borderRadius.lg,
  },

  // ── Interactive Calendar Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(16),
  },
  modalContent: {
    width: '100%',
    maxWidth: ms(360),
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.lg,
  },
  modalScrollContent: {
    paddingBottom: ms(16),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
  },
  modalTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#64748B',
    padding: ms(4),
  },
  yearPickerRow: {
    marginBottom: ms(10),
  },
  yearPickerLabel: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: ms(4),
  },
  yearScroll: {
    flexDirection: 'row',
    gap: ms(6),
    paddingBottom: ms(4),
  },
  yearChip: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: borderRadius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  yearChipText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#334155',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(8),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: ms(8),
  },
  monthNavBtn: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthNavBtnText: {
    fontSize: ms(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  monthNavTitle: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ms(6),
  },
  weekDayText: {
    width: ms(36),
    textAlign: 'center',
    fontSize: ms(10),
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ms(2),
  },
  dayCellInner: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInnerSelected: {
    backgroundColor: '#0F172A',
  },
  dayText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarCancelBtn: {
    marginTop: ms(16),
    marginBottom: ms(4),
    paddingVertical: ms(12),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCancelText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.3,
  },
});
