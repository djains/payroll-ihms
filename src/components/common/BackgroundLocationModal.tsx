import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  AppState,
  Platform,
} from 'react-native';
import { usePermissionStore } from '../../store/permissionStore';
import { openAppSettings } from '../../services/permission.service';
import { AppIcon } from './AppIcon';
import { styles } from './BackgroundLocationModal.styles';

export const BackgroundLocationModal: React.FC = () => {
  const {
    isBackgroundModalVisible,
    hideBackgroundModal,
    checkBackgroundPermission,
    requestBackgroundPermission,
  } = usePermissionStore();

  useEffect(() => {
    // Re-check background permission when returning from OS Settings
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkBackgroundPermission().then((granted) => {
          if (granted) {
            hideBackgroundModal();
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkBackgroundPermission, hideBackgroundModal]);

  // Background location is only an Android requirement (Android 10+ / API 29+)
  if (Platform.OS !== 'android' || !isBackgroundModalVisible) {
    return null;
  }

  const handleGrantPress = async () => {
    const granted = await requestBackgroundPermission();
    if (!granted) {
      // If user selected "Only while using the app" or direct prompt was bypassed by OS,
      // direct them to OS App Settings so they can select "Allow all the time".
      await openAppSettings();
    }
  };

  return (
    <Modal
      visible={isBackgroundModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideBackgroundModal}
    >
      <TouchableWithoutFeedback onPress={hideBackgroundModal}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              
              {/* Header Icon with Radar Ring */}
              <View style={styles.headerIconWrapper}>
                <View style={styles.radarRing} />
                <View style={styles.headerIconBadge}>
                  <AppIcon name="location" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.dutyBadge}>
                  <Text style={styles.dutyBadgeText}>LIVE SHIFT</Text>
                </View>
              </View>

              {/* Title & Prominent Disclosure Header */}
              <Text style={styles.title}>Background Location Required</Text>
              <Text style={styles.subtitle}>
                To verify your physical presence inside the assigned client site while on active duty shift.
              </Text>

              {/* Scrollable Content for 100% Fit Across All Device Screen Heights */}
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* 1. Purpose & Disclosure Card */}
                <View style={styles.disclosureCard}>
                  <View style={styles.disclosureHeader}>
                    <AppIcon name="shield-check" size={16} color="#0284C7" />
                    <Text style={styles.disclosureTitle}>Why does IHMS need this?</Text>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>
                      <Text style={styles.bulletBold}>Continuous Shift Tracking: </Text>
                      Verifies you stay within the geofenced site boundary even when your screen is locked or you switch apps.
                    </Text>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>
                      <Text style={styles.bulletBold}>Duty Hours Only: </Text>
                      Location tracking activates only upon <Text style={styles.bulletBold}>Punch In</Text> and immediately terminates when you <Text style={styles.bulletBold}>Punch Out</Text>.
                    </Text>
                  </View>

                  <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>
                      <Text style={styles.bulletBold}>Worker Safety & SOS: </Text>
                      Enables emergency response and supervisor assistance in case of field incidents.
                    </Text>
                  </View>
                </View>

                {/* 2. Instruction Card (Allow All The Time) */}
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionLabel}>Important Permission Step</Text>
                  <View style={styles.optionSample}>
                    <View style={styles.radioCircle}>
                      <View style={styles.radioInner} />
                    </View>
                    <Text style={styles.optionText}>Allow all the time</Text>
                    <View style={styles.tagRecommended}>
                      <Text style={styles.tagRecommendedText}>REQUIRED</Text>
                    </View>
                  </View>
                  <Text style={styles.instructionNote}>
                    * Please select "Allow all the time" on the next prompt so tracking does not disconnect when phone sleeps.
                  </Text>
                </View>

                {/* Privacy Guarantee */}
                <View style={styles.privacyStrip}>
                  <AppIcon name="check" size={12} color="#10B981" />
                  <Text style={styles.privacyText}>
                    Encrypted • No tracking outside duty hours • Zero data sharing
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {/* Primary Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGrantPress}
                  activeOpacity={0.82}
                >
                  <AppIcon name="location" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Allow All The Time</Text>
                </TouchableOpacity>

                {/* Secondary Button for Direct Settings */}
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={openAppSettings}
                  activeOpacity={0.75}
                >
                  <AppIcon name="settings" size={14} color="#475569" style={{ marginRight: 6 }} />
                  <Text style={styles.settingsButtonText}>Open Device Settings</Text>
                </TouchableOpacity>

                {/* Dismiss Button */}
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={hideBackgroundModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
