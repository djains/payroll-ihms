import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrap: {
    paddingHorizontal: ms(12),
    paddingTop: ms(12),
    paddingBottom: ms(40),
  },

  // Save Header Button
  saveBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontWeight: '800',
  },

  // Role Selector Section
  roleSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: ms(12),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: ms(11),
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ms(8),
  },
  roleScroll: {
    flexDirection: 'row',
    gap: ms(8),
    paddingVertical: ms(2),
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  roleChipText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#475569',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Responsive Stats & Presets Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: ms(10),
    marginBottom: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    backgroundColor: '#F0FDFA',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  statsBadgeText: {
    fontSize: ms(11),
    fontWeight: '800',
    color: '#0F766E',
  },
  roleLabelText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#64748B',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: ms(6),
  },
  presetBtn: {
    flex: 1,
    paddingVertical: ms(6),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#0F766E',
  },

  // Matrix List Header
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
    paddingHorizontal: ms(2),
  },
  matrixHeaderTitle: {
    fontSize: ms(11),
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matrixLegendRow: {
    flexDirection: 'row',
    gap: ms(6),
  },
  legendItem: {
    fontSize: ms(9),
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Feature Card
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: ms(12),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  moduleIconWrap: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginRight: ms(10),
  },
  moduleTitleWrap: {
    flex: 1,
  },
  moduleName: {
    fontSize: ms(13),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: ms(1),
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(5),
    paddingVertical: 1,
    borderRadius: 3,
  },
  moduleCategory: {
    fontSize: ms(9),
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // 4-Column Responsive CRUD Grid
  crudGrid: {
    flexDirection: 'row',
    gap: ms(6),
  },
  crudPill: {
    flex: 1,
    paddingVertical: ms(6),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  crudLetter: {
    fontSize: ms(12),
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 1,
  },
  crudSubLabel: {
    fontSize: ms(8),
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // READ Active (Blue)
  crudPillActiveR: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  crudLetterActiveR: {
    color: '#1D4ED8',
  },
  crudSubLabelActiveR: {
    color: '#2563EB',
  },

  // CREATE Active (Emerald)
  crudPillActiveC: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  crudLetterActiveC: {
    color: '#047857',
  },
  crudSubLabelActiveC: {
    color: '#059669',
  },

  // UPDATE Active (Amber)
  crudPillActiveU: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  crudLetterActiveU: {
    color: '#B45309',
  },
  crudSubLabelActiveU: {
    color: '#D97706',
  },

  // DELETE Active (Rose)
  crudPillActiveD: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  crudLetterActiveD: {
    color: '#B91C1C',
  },
  crudSubLabelActiveD: {
    color: '#DC2626',
  },
});
