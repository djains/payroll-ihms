import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  AppState,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { openAppSettings } from '../../services/permission.service';
import { AppIcon } from './AppIcon';
import { styles } from './PermissionPromptModal.styles';

export const PermissionPromptModal: React.FC = () => {
  const { isAuthenticated, isRestoring } = useAuthStore();
  const {
    isModalVisible,
    status,
    checkPermissions,
    requestPermissions,
    hideModal,
  } = usePermissionStore();

  const [hasRequestedOnce, setHasRequestedOnce] = useState(false);

  useEffect(() => {
    // Only check and prompt for permissions AFTER user has logged in
    if (isAuthenticated && !isRestoring) {
      checkPermissions();
    }

    // Auto re-check permissions when user resumes app (e.g. returning from device App Settings)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated && !isRestoring) {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isRestoring, checkPermissions]);

  // Never render on unauthenticated login screen or during initial auth restore
  if (!isAuthenticated || isRestoring || !isModalVisible) {
    return null;
  }

  const isLocationGranted = status?.location ?? false;
  const isCameraGranted = status?.camera ?? false;
  const isNotifGranted = status?.notifications ?? false;

  const hasMissingCompulsory = !isLocationGranted || !isCameraGranted;

  const handleGrantPress = async () => {
    setHasRequestedOnce(true);
    await requestPermissions();
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Only allow dismissing if compulsory permissions are granted
        if (!hasMissingCompulsory) {
          hideModal();
        }
      }}
    >
      <TouchableWithoutFeedback>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              
              {/* Header Icon Badge */}
              <View style={styles.headerIconBadge}>
                <AppIcon name="shield-alert" size={26} color="#D97706" />
              </View>

              {/* Title & Prominent Disclosure */}
              <Text style={styles.title}>Permissions Required</Text>
              <Text style={styles.subtitle}>
                Location and Camera are mandatory to verify duty attendance and prevent proxy punching.
              </Text>

              {/* Scrollable List to guarantee 100% fit on any phone screen */}
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* 1. Location Permission */}
                <View style={styles.permissionItem}>
                  <View style={[styles.iconBox, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
                    <AppIcon name="location" size={20} color="#0284C7" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>GPS Location</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isLocationGranted ? '#DCFCE7' : '#FEE2E2' },
                        ]}
                      >
                        <AppIcon
                          name={isLocationGranted ? 'check' : 'alert'}
                          size={10}
                          color={isLocationGranted ? '#16A34A' : '#DC2626'}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isLocationGranted ? '#16A34A' : '#DC2626' },
                          ]}
                        >
                          {isLocationGranted ? 'Allowed' : 'Compulsory'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      Verifies duty presence within authorized client site perimeter during clock-in/out.
                    </Text>
                  </View>
                </View>

                {/* 2. Camera Permission */}
                <View style={styles.permissionItem}>
                  <View style={[styles.iconBox, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
                    <AppIcon name="camera" size={20} color="#7C3AED" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>Camera Verification</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isCameraGranted ? '#DCFCE7' : '#FEE2E2' },
                        ]}
                      >
                        <AppIcon
                          name={isCameraGranted ? 'check' : 'alert'}
                          size={10}
                          color={isCameraGranted ? '#16A34A' : '#DC2626'}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isCameraGranted ? '#16A34A' : '#DC2626' },
                          ]}
                        >
                          {isCameraGranted ? 'Allowed' : 'Compulsory'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      Live selfies eliminate proxy attendance and record site audit proof.
                    </Text>
                  </View>
                </View>

                {/* 3. Notification Permission */}
                <View style={styles.permissionItem}>
                  <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <AppIcon name="bell" size={20} color="#D97706" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>Work Notifications</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isNotifGranted ? '#DCFCE7' : '#F1F5F9' },
                        ]}
                      >
                        <AppIcon
                          name={isNotifGranted ? 'check' : 'bell'}
                          size={10}
                          color={isNotifGranted ? '#16A34A' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isNotifGranted ? '#16A34A' : '#64748B' },
                          ]}
                        >
                          {isNotifGranted ? 'Allowed' : 'Optional'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      Alerts for shift rosters, branch duties, and leave approval updates.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {/* Primary Grant Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGrantPress}
                  activeOpacity={0.8}
                >
                  <AppIcon name="shield-check" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>
                    {hasRequestedOnce && hasMissingCompulsory ? 'Try Again / Grant' : 'Allow All Permissions'}
                  </Text>
                </TouchableOpacity>

                {/* Open App Settings Button (Always available for quick access) */}
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={openAppSettings}
                  activeOpacity={0.75}
                >
                  <AppIcon name="settings" size={14} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.settingsButtonText}>Open Device App Settings</Text>
                </TouchableOpacity>

                {/* Compulsory Warning Note */}
                {hasMissingCompulsory && (
                  <Text style={styles.compulsoryNotice}>
                    * Duty punch & live tracking remain locked until permissions are granted.
                  </Text>
                )}
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
