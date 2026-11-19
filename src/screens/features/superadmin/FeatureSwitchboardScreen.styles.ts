import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, shadows } from '../../../theme/spacing';
import { typography, fontSizes } from '../../../theme/typography';
import { ms } from '../../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2', // Warm Ivory Cream
  },

  // Top Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    backgroundColor: '#FAF8F2',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE4',
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitles: {
    flex: 1,
    marginLeft: ms(10),
  },
  headerMainTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: ms(11),
    color: '#6B7280',
    fontWeight: '600',
  },
  companyBadge: {
    backgroundColor: '#FDF1C8',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#EFE3B8',
  },
  companyBadgeText: {
    fontSize: ms(11),
    fontWeight: '800',
    color: '#111827',
  },

  scrollContent: {
    paddingHorizontal: ms(16),
    paddingTop: ms(10),
    paddingBottom: ms(100),
  },

  // Company Selector Horizontal Tabs
  companyTabsScroll: {
    marginBottom: ms(12),
  },
  companyTabsContainer: {
    gap: ms(8),
  },
  companyTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  companyTabPillActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  companyTabDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    marginRight: ms(6),
  },
  companyTabText: {
    fontSize: ms(12),
    color: '#6B7280',
    fontWeight: '600',
  },
  companyTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Hero Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: ms(16),
    borderWidth: 1.5,
    borderColor: '#EFECE4',
    marginBottom: ms(16),
    ...shadows.sm,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  summaryDot: {
    fontSize: ms(11),
    marginRight: ms(4),
  },
  summaryLabel: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: ms(36),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginVertical: ms(2),
  },
  heroUnit: {
    fontSize: ms(14),
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  summaryDesc: {
    fontSize: ms(12),
    color: '#6B7280',
    lineHeight: ms(17),
    marginTop: ms(4),
    marginBottom: ms(12),
  },
  batchActionsRow: {
    flexDirection: 'row',
    gap: ms(8),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: ms(12),
  },
  batchBtn: {
    flex: 1,
    paddingVertical: ms(8),
    borderRadius: ms(10),
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#EFECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchBtnText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#111827',
  },

  // Category Filter Tabs
  categoryTabsScroll: {
    marginBottom: ms(14),
  },
  categoryTabsContainer: {
    gap: ms(6),
  },
  categoryFilterPill: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  categoryFilterPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryFilterText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#6B7280',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
    marginTop: ms(2),
  },
  sectionTitle: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  sectionMeta: {
    fontSize: ms(11),
    color: '#6B7280',
    fontWeight: '600',
  },

  // Feature Card (Identical Structure to Role Card)
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: ms(14),
    marginBottom: ms(12),
    borderWidth: 1.5,
    borderColor: '#EFECE4',
    ...shadows.sm,
  },
  featureCardActive: {
    borderColor: '#D1FAE5',
  },
  featureCardTop: {
    flexDirection: 'row',
    marginBottom: ms(10),
  },
  featureIconSquircle: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
    marginLeft: ms(12),
  },
  featureNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(4),
  },
  featureName: {
    fontSize: ms(14),
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: ms(8),
  },
  statusBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(6),
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeInactive: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: ms(9),
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  featureDesc: {
    fontSize: ms(11),
    color: '#6B7280',
    lineHeight: ms(15),
  },

  // Feature Card Bottom Row
  featureCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: ms(10),
    marginTop: ms(2),
  },
  categoryBadgePill: {
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#EFECE4',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(6),
  },
  categoryBadgeText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#4B5563',
  },

  // Toggle Action Button
  toggleBtn: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(7),
    borderRadius: ms(10),
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleBtnInactive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  toggleBtnText: {
    fontSize: ms(11),
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#DC2626',
  },
  toggleTextInactive: {
    color: '#FFFFFF',
  },

  // Bottom Sticky Save Bar
  stickySaveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFECE4',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    ...shadows.md,
  },
  saveBtn: {
    backgroundColor: '#111827',
    borderRadius: borderRadius.full,
    paddingVertical: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: ms(14),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
