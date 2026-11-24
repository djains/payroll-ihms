import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { useNotificationStore, NotificationItem } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '../../navigation';
import { colors } from '../../theme/colors';
import { ms } from '../../theme/responsive';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { fontSizes } from '../../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatRelativeTime(isoStr: string): string {
  if (!isoStr) return '';
  const dt = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return dt.toLocaleDateString('default', { month: 'short', day: 'numeric' });
}

export const NotificationModal: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { notifications, unreadCount, isOpen, setOpen, markAsRead, markAllAsRead, clearNotifications } =
    useNotificationStore();
  const { navigate } = useNavigation();

  const userEmpCode = String(currentUser?.empCode || currentUser?.username || '').trim().toLowerCase();
  const isCompanyAdmin =
    currentUser?.role === 'COMPANY_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    Boolean((currentUser as any)?.isCompanyAdmin);

  const visibleNotifications = notifications.filter((n) => {
    if (isCompanyAdmin) return true;
    if (!n.empCode) return true;
    return n.empCode.toLowerCase() === userEmpCode;
  });
  const myUnreadCount = visibleNotifications.filter((n) => !n.read).length;

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    setOpen(false);

    if (item.targetScreen) {
      try {
        navigate(item.targetScreen as any, item.targetParams);
      } catch (err) {
        console.warn('Could not navigate to targetScreen:', item.targetScreen, err);
      }
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Bar */}
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.headerBellWrap}>
                    <AppIcon name="bell" size={18} color="#0F766E" />
                  </View>
                  <Text style={styles.headerTitle}>Notifications</Text>
                  {myUnreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{myUnreadCount} New</Text>
                    </View>
                  )}
                </View>

                <View style={styles.headerActions}>
                  {myUnreadCount > 0 && (
                    <TouchableOpacity
                      onPress={markAllAsRead}
                      style={styles.markAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setOpen(false)}
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notifications List */}
              <ScrollView
                style={styles.listScroll}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {visibleNotifications.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <AppIcon name="bell" size={32} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptySub}>
                      You are all caught up! New alerts and shift reminders will appear here.
                    </Text>
                  </View>
                ) : (
                  visibleNotifications.map((item) => {
                    const isUnread = !item.read;
                    const cardBg = isUnread ? '#F0FDFA' : '#FFFFFF';
                    const borderColor = isUnread ? '#99F6E4' : '#E2E8F0';

                    let iconName = 'bell';
                    let iconColor = '#0F766E';
                    let iconBg = '#CCFBF1';

                    if (item.category === 'GEOFENCE') {
                      iconName = 'location';
                      iconColor = '#DC2626';
                      iconBg = '#FEE2E2';
                    } else if (item.category === 'PUNCH_IN' || item.category === 'PUNCH_OUT') {
                      iconName = 'clock';
                      iconColor = '#2563EB';
                      iconBg = '#DBEAFE';
                    } else if (item.category === 'SALARY') {
                      iconName = 'document';
                      iconColor = '#16A34A';
                      iconBg = '#DCFCE7';
                    }

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}
                        onPress={() => handleNotificationPress(item)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.itemIconWrap, { backgroundColor: iconBg }]}>
                          <AppIcon name={iconName} size={18} color={iconColor} />
                        </View>

                        <View style={styles.itemContent}>
                          <View style={styles.itemTopRow}>
                            <Text style={[styles.itemTitle, isUnread && styles.itemTitleBold]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.itemTime}>{formatRelativeTime(item.createdAt)}</Text>
                          </View>

                          <Text style={styles.itemMessage} numberOfLines={3}>
                            {item.message}
                          </Text>

                          {item.distanceInfo && (
                            <View style={styles.distancePill}>
                              <Text style={styles.distancePillText}>📍 {item.distanceInfo}</Text>
                            </View>
                          )}
                        </View>

                        {isUnread && <View style={styles.unreadDot} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Bottom Clear Footer */}
              {visibleNotifications.length > 0 && (
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    onPress={clearNotifications}
                    style={styles.clearAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    maxHeight: SCREEN_HEIGHT * 0.78,
    minHeight: ms(320),
    paddingBottom: Platform.OS === 'android' ? ms(24) : ms(34),
    ...shadows.lg,
  },
  dragHandle: {
    width: ms(40),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: ms(10),
    marginBottom: ms(8),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(18),
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  headerBellWrap: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.full,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xxs,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  markAllBtn: {
    paddingVertical: ms(4),
    paddingHorizontal: ms(6),
  },
  markAllText: {
    fontSize: fontSizes.xs,
    color: '#0F766E',
    fontWeight: '700',
  },
  closeBtn: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: ms(16),
    gap: ms(10),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(50),
    paddingHorizontal: ms(24),
  },
  emptyIconCircle: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#334155',
    marginBottom: ms(6),
  },
  emptySub: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(18),
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: ms(12),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: ms(10),
    position: 'relative',
    ...shadows.sm,
  },
  itemIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(2),
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(2),
  },
  itemTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: ms(6),
  },
  itemTitleBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  itemTime: {
    fontSize: fontSizes.xxs,
    color: '#94A3B8',
    fontWeight: '600',
  },
  itemMessage: {
    fontSize: fontSizes.xs,
    color: '#475569',
    lineHeight: ms(16),
  },
  distancePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
    marginTop: ms(6),
  },
  distancePillText: {
    fontSize: fontSizes.xxs,
    color: '#DC2626',
    fontWeight: '700',
  },
  unreadDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#0F766E',
    position: 'absolute',
    top: ms(12),
    right: ms(12),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: ms(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clearAllBtn: {
    paddingVertical: ms(6),
    paddingHorizontal: ms(16),
  },
  clearAllText: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
