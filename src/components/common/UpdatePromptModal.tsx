import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useUpdateStore } from '../../store/updateStore';
import {
  startInAppUpdate,
  completeInAppUpdate,
} from '../../services/inAppUpdate.service';
import { AppIcon } from './AppIcon';
import { styles } from './UpdatePromptModal.styles';

export const UpdatePromptModal: React.FC = () => {
  const {
    isModalVisible,
    updateInfo,
    isDownloading,
    isDownloaded,
    downloadPercent,
    hideModal,
  } = useUpdateStore();

  if (!isModalVisible && !isDownloaded && !isDownloading) {
    return null;
  }

  const currentVer = updateInfo?.currentVersionName || '2.0';
  const newVerCode = updateInfo?.availableVersionCode || 2;

  const handleUpdatePress = async () => {
    if (isDownloaded) {
      await completeInAppUpdate();
    } else {
      await startInAppUpdate();
    }
  };

  return (
    <Modal
      visible={isModalVisible || isDownloaded}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideModal}
    >
      <TouchableWithoutFeedback onPress={isDownloaded ? undefined : hideModal}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Play Store Rocket Badge */}
              <View style={styles.iconWrapper}>
                <AppIcon name={isDownloaded ? 'check' : 'arrowUp'} size={28} color="#0F766E" />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>
                {isDownloaded ? 'Update Ready to Install!' : 'New Update on Play Store!'}
              </Text>
              <Text style={styles.subtitle}>
                {isDownloaded
                  ? 'The latest update has been downloaded in the background. Restart to apply now.'
                  : 'A newer version of NG GLOBAL is available on Google Play Store with critical fixes & speed improvements.'}
              </Text>

              {/* Version Comparison Tag */}
              <View style={styles.versionPillRow}>
                <Text style={styles.versionPillText}>
                  Installed: <Text style={{ color: '#64748B' }}>v{currentVer}</Text>
                </Text>
                <AppIcon name="chevronRight" size={14} color="#94A3B8" />
                <Text style={styles.versionPillText}>
                  Play Store: <Text style={styles.versionPillHighlight}>Build {newVerCode}</Text>
                </Text>
              </View>

              {/* Feature Points */}
              {!isDownloading && !isDownloaded && (
                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <View style={styles.featureCheckBadge}>
                      <AppIcon name="check" size={11} color="#059669" />
                    </View>
                    <Text style={styles.featureText}>Enhanced facial & geofence punch accuracy</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <View style={styles.featureCheckBadge}>
                      <AppIcon name="check" size={11} color="#059669" />
                    </View>
                    <Text style={styles.featureText}>Faster offline syncing & attendance reports</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <View style={styles.featureCheckBadge}>
                      <AppIcon name="check" size={11} color="#059669" />
                    </View>
                    <Text style={styles.featureText}>Critical security and stability updates</Text>
                  </View>
                </View>
              )}

              {/* Downloading Progress Bar */}
              {isDownloading && !isDownloaded && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${downloadPercent}%` }]} />
                  </View>
                  <Text style={styles.progressLabel}>
                    Downloading update from Play Store... {downloadPercent}%
                  </Text>
                </View>
              )}

              {/* Downloaded Ready Notice */}
              {isDownloaded && (
                <View style={styles.restartNoticeBox}>
                  <View style={styles.restartNoticeRow}>
                    <AppIcon name="check" size={14} color="#065F46" />
                    <Text style={styles.restartNoticeText}>
                      Download Complete! Tap restart below.
                    </Text>
                  </View>
                </View>
              )}

              {/* Primary Action Button */}
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleUpdatePress}
                activeOpacity={0.8}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppIcon name={isDownloaded ? 'refresh' : 'arrowUp'} size={18} color="#FFFFFF" />
                )}
                <Text style={styles.btnPrimaryText}>
                  {isDownloaded
                    ? 'Restart & Apply Update'
                    : isDownloading
                    ? `Downloading (${downloadPercent}%)`
                    : 'Update Now'}
                </Text>
              </TouchableOpacity>

              {/* Later Dismiss Button (Only if not force downloading) */}
              {!isDownloading && (
                <TouchableOpacity
                  style={styles.btnLater}
                  onPress={hideModal}
                  activeOpacity={0.6}
                >
                  <Text style={styles.btnLaterText}>Remind Me Later</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
