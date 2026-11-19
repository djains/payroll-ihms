import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from './PoliceVerificationScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppButton,
  AppTextInput,
  StatusBadge,
  AppIcon,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';
import { staffApi } from '../../../api';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export const PoliceVerificationScreen: React.FC = () => {
  const [tokenNumber, setTokenNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [docPhoto, setDocPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  useEffect(() => {
    fetchExistingStatus();
  }, []);

  const fetchExistingStatus = async () => {
    try {
      const empCode = currentUser?.empCode || currentUser?.username || '';
      const res = await staffApi.getDocumentsStatus(empCode);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        const pol = list.find((item: any) => item.image_name === 'police_verification_form');
        if (pol) {
          setCurrentRecord(pol);
          if (pol.field1) setTokenNumber(pol.field1);
          if (pol.field2) setValidUntil(pol.field2);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setDocPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `police_doc_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Captured',
            message: 'Clearance certificate attached.',
          });
        }
      });
    }, 250);
  };

  const openGalleryPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setDocPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `police_doc_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Selected',
            message: 'Clearance certificate attached.',
          });
        }
      });
    }, 250);
  };

  const handleSubmit = async () => {
    if (!tokenNumber.trim()) {
      showToast({
        type: 'warning',
        title: 'Missing Details',
        message: 'Please enter the police certificate or token number.',
      });
      return;
    }

    if (!docPhoto) {
      showToast({
        type: 'warning',
        title: 'Document Required',
        message: 'Please photograph or select the police verification certificate.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const empCode = currentUser?.empCode || currentUser?.username || '';
      const empName = currentUser?.name || 'Staff User';

      const formData = new FormData();
      formData.append('emp_code', empCode);
      formData.append('emp_name', empName);
      formData.append('image_name', 'police_verification_form');
      formData.append('field1', tokenNumber.trim());
      formData.append('field2', validUntil.trim());
      formData.append('file', {
        uri: docPhoto.uri,
        name: docPhoto.name,
        type: docPhoto.type,
      } as any);

      const res = await staffApi.uploadDocument(formData);

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Document Submitted',
          message: 'Police clearance certificate submitted for verification.',
        });
        goBack();
      } else {
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: res.error || 'Failed to submit certificate. Please try again.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Upload Error',
        message: e?.message || 'Network error while uploading.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = currentCompany?.brandColor || colors.primary;

  const statusVal = currentRecord
    ? currentRecord.reject === 2
      ? 'approved'
      : currentRecord.reject === 1
      ? 'rejected'
      : 'pending'
    : 'pending';

  const statusLabel = currentRecord
    ? currentRecord.reject === 2
      ? 'Verified Active'
      : currentRecord.reject === 1
      ? 'Rejected'
      : 'Under Review'
    : 'Not Uploaded';

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container}>
      <AppHeader
        title="Police Clearance Verification"
        onBack={goBack}
      />

      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <StatusBadge status={statusVal} label={statusLabel} />
        </View>

        {currentRecord?.comments ? (
          <View style={{ marginBottom: 12, padding: 8, backgroundColor: colors.surfaceVariant, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Note: {currentRecord.comments}
            </Text>
          </View>
        ) : null}

        <AppTextInput
          label="Police Certificate / Token Number"
          placeholder="e.g. POL-MH-2026-88412"
          value={tokenNumber}
          onChangeText={setTokenNumber}
          iconLeft="shield"
        />

        <AppTextInput
          label="Valid Until Expiry Date (Optional)"
          placeholder="DD/MM/YYYY"
          value={validUntil}
          onChangeText={setValidUntil}
          iconLeft="calendar"
        />

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 8 }}>
          Clearance Certificate Photo
        </Text>

        {docPhoto ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: docPhoto.uri }} style={styles.cardPreview} resizeMode="cover" />
            <View style={styles.imageActionOverlay}>
              <TouchableOpacity
                onPress={() => setIsPhotoPickerOpen(true)}
                style={styles.changeImageBtn}
                activeOpacity={0.8}
              >
                <AppIcon name="camera" size={14} color="#FFFFFF" />
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDocPhoto(null)}
                style={styles.removeImageBtn}
                activeOpacity={0.8}
              >
                <AppIcon name="x" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setIsPhotoPickerOpen(true)}
            style={styles.uploadBox}
            activeOpacity={0.7}
          >
            <AppIcon name="camera" size={32} color={brandColor} />
            <Text style={styles.uploadText}>Photograph police clearance certificate</Text>
          </TouchableOpacity>
        )}

        <AppButton
          title={isSubmitting ? 'Submitting...' : 'Submit Clearance Certificate'}
          onPress={handleSubmit}
          iconLeft={isSubmitting ? undefined : 'check'}
          disabled={isSubmitting}
          style={styles.submitBtn}
          customColor={brandColor}
        />
      </View>

      {/* Camera / Gallery Selection Modal */}
      <CustomAlertModal
        visible={isPhotoPickerOpen}
        title="Upload Certificate Photo"
        message="Choose how you would like to photograph or attach your police certificate."
        type="choose"
        onClose={() => setIsPhotoPickerOpen(false)}
        buttons={[
          {
            text: 'Camera',
            icon: 'camera',
            onPress: openCameraPicker,
          },
          {
            text: 'Gallery',
            icon: 'document',
            onPress: openGalleryPicker,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsPhotoPickerOpen(false),
          },
        ]}
      />
    </AppScreenContainer>
  );
};
