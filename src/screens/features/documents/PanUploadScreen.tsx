import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from './PanUploadScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppButton,
  AppTextInput,
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

// PAN format: 5 letters, 4 digits, 1 letter
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const PanUploadScreen: React.FC = () => {
  const [panNumber, setPanNumber] = useState('');
  const [panPhoto, setPanPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setPanPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `pan_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Captured',
            message: 'PAN card photo attached.',
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
          setPanPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `pan_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Selected',
            message: 'PAN card photo attached.',
          });
        }
      });
    }, 250);
  };

  const handleSubmit = async () => {
    const cleanPan = panNumber.trim().toUpperCase();
    if (!PAN_REGEX.test(cleanPan)) {
      setError('Invalid PAN format (e.g. ABCDE1234F).');
      return;
    }

    if (!panPhoto) {
      showToast({
        type: 'warning',
        title: 'Photo Required',
        message: 'Please attach a photo of your physical PAN card.',
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
      formData.append('image_name', 'Pan_card_upload');
      formData.append('field1', cleanPan);
      formData.append('file', {
        uri: panPhoto.uri,
        name: panPhoto.name,
        type: panPhoto.type,
      } as any);

      const res = await staffApi.uploadDocument(formData);

      // Best effort update in employee-kyc as well
      try {
        await staffApi.submitKyc({
          emp_code: empCode,
          pan: cleanPan,
        });
      } catch (err) {
        // ignore secondary sync
      }

      if (res.success) {
        showToast({
          type: 'success',
          title: 'PAN Card Submitted',
          message: 'Your PAN card has been submitted for review.',
        });
        goBack();
      } else {
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: res.error || 'Failed to submit PAN card. Please try again.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Upload Error',
        message: e?.message || 'Network error while submitting PAN card.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = currentCompany?.brandColor || colors.primary;

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container}>
      <AppHeader
        title="PAN Card Upload"
        onBack={goBack}
      />

      <View style={styles.card}>
        <AppTextInput
          label="10-Digit Alphanumeric PAN"
          placeholder="e.g. ABCDE1234F"
          value={panNumber}
          onChangeText={(val) => {
            setPanNumber(val.toUpperCase());
            if (error) setError('');
          }}
          autoCapitalize="characters"
          maxLength={10}
          iconLeft="document"
          error={error}
        />

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 8 }}>
          PAN Card Photo
        </Text>

        {panPhoto ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: panPhoto.uri }} style={styles.cardPreview} resizeMode="cover" />
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
                onPress={() => setPanPhoto(null)}
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
            style={styles.photoBox}
            activeOpacity={0.7}
          >
            <AppIcon name="camera" size={32} color={brandColor} />
            <Text style={styles.photoText}>Tap to photograph physical PAN card</Text>
          </TouchableOpacity>
        )}

        <AppButton
          title={isSubmitting ? 'Submitting...' : 'Submit PAN Card'}
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
        title="Upload PAN Photo"
        message="Choose how you would like to attach your PAN card photo."
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
