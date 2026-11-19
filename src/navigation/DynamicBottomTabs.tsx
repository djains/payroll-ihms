import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './DynamicBottomTabs.styles';
import { AppIcon } from '../components/common/AppIcon';
import { useTenantStore } from '../store/tenantStore';
import { useAuthStore } from '../store/authStore';
import { useNavigation, useNavigationState } from './navigationContext';
import { ScreenName } from './types';
import { colors } from '../theme/colors';

export const DynamicBottomTabs: React.FC = () => {
  const { allowedTabs } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { navigate } = useNavigation();
  const { currentRoute } = useNavigationState();
  const insets = useSafeAreaInsets();

  // If user is non-superadmin or on UnifiedDashboard, hide bottom tabs for clean cards view
  if (
    currentUser?.role !== 'SUPER_ADMIN' ||
    currentRoute.name === 'SuperAdminDashboard' ||
    currentRoute.name === 'UnifiedDashboard' ||
    currentRoute.name === 'StaffDashboard' ||
    currentRoute.name === 'SupervisorDashboard' ||
    currentRoute.name === 'HousekeepingDashboard'
  ) {
    return null;
  }

  if (!allowedTabs || allowedTabs.length === 0) {
    return null;
  }

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 22 : 12);

  return (
    <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
      {allowedTabs.map((tab) => {
        const isActive = currentRoute.name === tab.name;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => navigate(tab.name as ScreenName)}
            style={styles.tabItem}
          >
            {isActive ? (
              <View style={styles.activePill}>
                <AppIcon
                  name={tab.icon}
                  size={20}
                  color="#111827"
                />
              </View>
            ) : (
              <View style={styles.inactiveIconWrap}>
                <AppIcon
                  name={tab.icon}
                  size={22}
                  color="#9CA3AF"
                />
              </View>
            )}

            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
