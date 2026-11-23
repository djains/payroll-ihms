import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

  useEffect(() => {
    // Only check and prompt for permissions AFTER user has logged in
    if (isAuthenticated && !isRestoring) {
      checkPermissions();
    }
  }, [isAuthenticated, isRestoring, checkPermissions]);

  // Never render on unauthenticated login screen or during initial auth restore
  if (!isAuthenticated || isRestoring || !isModalVisible) {
    return null;
  }

  const isLocationGranted = status?.location ?? false;
  const isCameraGranted = status?.camera ?? false;
  const isNotifGranted = status?.notifications ?? false;

  const handleGrantPress = async () => {
    // Requests system permissions and automatically dismisses modal so user continues directly
    await requestPermissions();
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideModal}
    >
      <TouchableWithoutFeedback>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              
              {/* Header Icon Badge */}
              <View style={styles.headerIconBadge}>
                <AppIcon name="shield-check" size={28} color="#D97706" />
              </View>

              {/* Title & Google Play Prominent Disclosure */}
              <Text style={styles.title}>Permissions Required</Text>
              <Text style={styles.subtitle}>
                To enable geofenced duty attendance and anti-proxy verification, NG GLOBAL requires the following device permissions:
              </Text>

              {/* List of Permissions */}
              <View style={styles.permissionList}>
                
                {/* 1. Location Permission */}
                <View style={styles.permissionItem}>
                  <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                    <AppIcon name="location" size={20} color="#0284C7" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>Precise GPS Location</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isLocationGranted ? '#DCFCE7' : '#FEF3C7' },
                        ]}
                      >
                        <AppIcon
                          name={isLocationGranted ? 'check' : 'alert'}
                          size={10}
                          color={isLocationGranted ? '#16A34A' : '#D97706'}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isLocationGranted ? '#16A34A' : '#D97706' },
                          ]}
                        >
                          {isLocationGranted ? 'Granted' : 'Required'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      Verifies your presence within authorized client site perimeter during duty clock-in/out.
                    </Text>
                  </View>
                </View>

                {/* 2. Camera Permission */}
                <View style={styles.permissionItem}>
                  <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                    <AppIcon name="camera" size={20} color="#9333EA" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>Camera & Live Verification</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isCameraGranted ? '#DCFCE7' : '#FEF3C7' },
                        ]}
                      >
                        <AppIcon
                          name={isCameraGranted ? 'check' : 'alert'}
                          size={10}
                          color={isCameraGranted ? '#16A34A' : '#D97706'}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isCameraGranted ? '#16A34A' : '#D97706' },
                          ]}
                        >
                          {isCameraGranted ? 'Granted' : 'Required'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      Captures real-time verification selfies to eliminate proxy punching and logs site audit proof.
                    </Text>
                  </View>
                </View>

                {/* 3. Notification Permission */}
                <View style={styles.permissionItem}>
                  <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                    <AppIcon name="bell" size={20} color="#D97706" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>Work Notifications</Text>
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
                          {isNotifGranted ? 'Granted' : 'Optional'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      Alerts you for shift rosters, branch assignments, and leave approval updates.
                    </Text>
                  </View>
                </View>

              </View>

              {/* Primary Grant Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGrantPress}
                activeOpacity={0.8}
              >
                <AppIcon name="shield-check" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Allow All Permissions</Text>
              </TouchableOpacity>

              {/* Secondary Options */}
              <View style={styles.secondaryRow}>
                <TouchableOpacity
                  style={styles.textLink}
                  onPress={openAppSettings}
                  activeOpacity={0.7}
                >
                  <AppIcon name="settings" size={14} color="#0284C7" style={{ marginRight: 5 }} />
                  <Text style={styles.settingsLinkTitle}>App Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.textLink}
                  onPress={hideModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textLinkTitle}>Continue to App</Text>
                  <AppIcon name="chevronRight" size={12} color="#64748B" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
