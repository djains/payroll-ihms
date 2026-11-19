import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, shadows } from '../../../theme/spacing';
import { fontSizes } from '../../../theme/typography';
import { ms } from '../../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: ms(100),
    backgroundColor: '#F8FAFC',
  },

  // ── Custom Flush Edge-to-Edge Top Header Bar ──
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
    marginBottom: spacing.sm,
    gap: ms(8),
    ...shadows.sm,
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    flex: 1,
    minWidth: 0, // Prevents flex child overflow
  },
  backIconButton: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerTotalBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  headerTotalText: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '800',
    color: '#0F766E',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
  },

  // ── Top Summary Imprest Banner ──
  imprestBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: ms(16),
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  imprestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    flex: 1,
  },
  imprestIconBox: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imprestTitle: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  imprestSub: {
    fontSize: fontSizes.xxs + 1,
    color: '#64748B',
    fontWeight: '500',
    marginTop: ms(1),
  },
  imprestCountPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
  },
  imprestCountText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#2563EB',
  },

  // ── Tabs Container ──
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: ms(10),
    marginBottom: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    paddingVertical: ms(11),
    borderRadius: ms(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
  },
  tabText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Form Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  formSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: spacing.sm,
    paddingBottom: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formSectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },

  // Receipt Visual Preview Container
  previewContainer: {
    marginVertical: spacing.sm,
  },
  previewImageBox: {
    width: '100%',
    height: ms(200),
    borderRadius: ms(16),
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeFloatingBtn: {
    position: 'absolute',
    bottom: ms(10),
    right: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: borderRadius.full,
  },
  changeFloatingText: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: ms(10),
    right: ms(10),
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Receipt Upload Box
  uploadBox: {
    height: ms(116),
    backgroundColor: '#F8FAFC',
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: spacing.sm,
    padding: spacing.sm,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(4),
  },
  uploadText: {
    color: '#0F172A',
    fontSize: fontSizes.xs + 1,
    fontWeight: '700',
    marginTop: ms(4),
  },
  uploadSub: {
    color: '#64748B',
    fontSize: fontSizes.xxs + 1,
    marginTop: ms(2),
  },
  photoAttachedWrap: {
    alignItems: 'center',
  },
  photoAttachedText: {
    color: '#15803D',
    fontSize: fontSizes.xs + 1,
    fontWeight: '800',
    marginTop: ms(4),
  },
  photoSubText: {
    color: '#16A34A',
    fontSize: fontSizes.xxs + 1,
    marginTop: ms(2),
  },
  submitBtn: {
    marginTop: spacing.sm,
    borderRadius: ms(14),
  },

  // ── History List Container ──
  historyContainer: {
    paddingHorizontal: spacing.md,
    gap: ms(10),
  },
  loadingBox: {
    paddingVertical: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
  },
  loadingText: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: ms(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: ms(6),
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: ms(10),
  },
  emptySub: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    textAlign: 'center',
    marginTop: ms(4),
  },

  // Claim Tile (Paytm Transaction Style)
  claimTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(13),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  claimTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(10),
  },
  claimTileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    flex: 1,
  },
  claimIconCircle: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimItemTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  claimShopText: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '500',
    marginTop: ms(1),
  },
  claimAmountText: {
    fontSize: fontSizes.md + 1,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  claimTileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: ms(8),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3.5),
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '800',
  },
  claimDateText: {
    fontSize: fontSizes.xxs + 1,
    color: '#64748B',
    fontWeight: '600',
  },
});
