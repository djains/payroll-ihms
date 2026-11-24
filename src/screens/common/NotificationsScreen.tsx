import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { AppScreenContainer, AppHeader, AppIcon } from '../../components/common';
import { useNotificationStore, NotificationItem } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '../../navigation';
import { styles } from './NotificationsScreen.styles';
import { colors } from '../../theme/colors';

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

export const NotificationsScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, syncNotifications } =
    useNotificationStore();
  const { goBack, navigate } = useNavigation();

  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  useEffect(() => {
    syncNotifications(currentUser);
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncNotifications(currentUser);
    setRefreshing(false);
  };

  const handleCardPress = (item: NotificationItem) => {
    markAsRead(item.id);

    if (item.targetScreen) {
      try {
        navigate(item.targetScreen as any, item.targetParams);
      } catch (err) {
        console.warn('Could not navigate to targetScreen:', item.targetScreen, err);
      }
    }
  };

  return (
    <AppScreenContainer
      scrollable
      header={
        <AppHeader
          title="Notifications"
          subtitle="Alerts & Shift Reminders"
          onBack={goBack}
          rightComponent={
            myUnreadCount > 0 ? (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markReadBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.markReadBtnText}>Mark all read</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />}
      contentContainerStyle={styles.container}
    >
      {/* Notifications List */}
      {visibleNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <AppIcon name="bell" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            New shift reminders, salary slips, and duty alerts will appear here.
          </Text>
        </View>
      ) : (
        visibleNotifications.map((item) => {
          const isUnread = !item.read;

          let iconName = 'bell';
          let iconColor = '#0F766E';
          let iconBg = '#CCFBF1';
          let actionLabel = 'View Details';

          if (item.category === 'GEOFENCE') {
            iconName = 'alert';
            iconColor = '#DC2626';
            iconBg = '#FEE2E2';
            actionLabel = 'View Location';
          } else if (item.category === 'PUNCH_IN' || item.category === 'PUNCH_OUT') {
            iconName = 'clock';
            iconColor = '#2563EB';
            iconBg = '#DBEAFE';
            actionLabel = 'Go to Punch';
          } else if (item.category === 'SALARY') {
            iconName = 'document';
            iconColor = '#16A34A';
            iconBg = '#DCFCE7';
            actionLabel = 'View Salary Slip';
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.notifCard, isUnread && styles.notifCardUnread]}
              onPress={() => handleCardPress(item)}
              activeOpacity={0.8}
            >
              {/* Card Header */}
              <View style={styles.cardTopRow}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardIconWrap, { backgroundColor: iconBg }]}>
                    <AppIcon name={iconName} size={18} color={iconColor} />
                  </View>
                  <Text style={[styles.cardTitle, isUnread && styles.cardTitleBold]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.cardTime}>{formatRelativeTime(item.createdAt)}</Text>
              </View>

              {/* Message */}
              <Text style={styles.cardMessage}>{item.message}</Text>

              {/* Card Bottom Meta */}
              <View style={styles.cardBottomRow}>
                <View style={styles.tagWrap}>
                  {item.distanceInfo && (
                    <View style={styles.distanceTag}>
                      <Text style={styles.distanceTagText}>📍 {item.distanceInfo}</Text>
                    </View>
                  )}
                </View>

                {item.targetScreen && (
                  <View style={styles.actionTextBtn}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                    <AppIcon name="arrowRight" size={12} color="#0F766E" />
                  </View>
                )}
              </View>

              {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })
      )}

      {/* Footer Clear All */}
      {visibleNotifications.length > 0 && (
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearNotifications}
            activeOpacity={0.7}
          >
            <Text style={styles.clearBtnText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </View>
      )}
    </AppScreenContainer>
  );
};
