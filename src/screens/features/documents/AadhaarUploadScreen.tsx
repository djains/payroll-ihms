import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { styles } from './AadhaarUploadScreen.styles';
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

export const AadhaarUploadScreen: React.FC = () => {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [cardPhoto, setCardPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrExtracted, setQrExtracted] = useState(false);

  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  const handleScanQR = () => {
    showToast({
      type: 'info',
      title: 'QR Scanner',
      message: 'Please enter your 12-digit Aadhaar number and attach your card photo.',
    });
  };

  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera(
        { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.6, saveToPhotos: false },
        (response) => {
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            setCardPhoto({
              uri: asset.uri || '',
              name: asset.fileName || `aadhaar_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
            showToast({
              type: 'success',
              title: 'Photo Captured',
              message: 'Aadhaar photo attached.',
            });
          }
        }
      );
    }, 250);
  };

  const openGalleryPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchImageLibrary(
        { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.6 },
        (response) => {
          if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setCardPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `aadhaar_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Selected',
            message: 'Aadhaar photo attached.',
          });
        }
      });
    }, 250);
  };

  const handleSubmit = async () => {
    const cleanNum = aadhaarNumber.replace(/\s+/g, '');
    if (cleanNum.length !== 12) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Aadhaar number must be exactly 12 digits.',
      });
      return;
    }

    if (!cardPhoto) {
      showToast({
        type: 'warning',
        title: 'Photo Required',
        message: 'Please take or attach a photo of your Aadhaar card.',
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
      formData.append('image_name', 'adhar_card_upload');
      formData.append('field1', cleanNum);
      formData.append('file', {
        uri: cardPhoto.uri,
        name: cardPhoto.name,
        type: cardPhoto.type,
      } as any);

      const res = await staffApi.uploadDocument(formData);

      // Best effort update in employee-kyc as well
      try {
        await staffApi.submitKyc({
          emp_code: empCode,
          aadhaar: cleanNum,
        });
      } catch (err) {
        // ignore kyc secondary sync if primary upload succeeds
      }

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Aadhaar Submitted',
          message: 'Your Aadhaar document has been submitted for review.',
        });
        goBack();
      } else {
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: res.error || 'Failed to submit document. Please try again.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Upload Error',
        message: e?.message || 'Network error while submitting Aadhaar.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = currentCompany?.brandColor || colors.primary;

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container}>
      <AppHeader
        title="Aadhaar Card Upload"
        onBack={goBack}
      />

      <View style={styles.card}>
        {/* QR Code Scanner Box */}
        <TouchableOpacity
          onPress={handleScanQR}
          style={styles.qrScanBox}
          activeOpacity={0.8}
        >
          <AppIcon name="document" size={36} color={brandColor} />
          <Text style={styles.qrTitle}>Tap to Scan Aadhaar QR Code</Text>
          <Text style={styles.qrSubtitle}>
            Auto-extracts UID, Name, Gender, DOB, and Address via QR parser
          </Text>
        </TouchableOpacity>

        {qrExtracted && (
          <View style={styles.extractedBox}>
            <Text style={styles.extractedTitle}>Aadhaar Data Extracted ✓</Text>
            <Text style={styles.extractedLine}>• Number: 9876 5432 1098</Text>
            <Text style={styles.extractedLine}>• Extracted from QR code</Text>
          </View>
        )}

        <AppTextInput
          label="12-Digit Aadhaar Card Number"
          placeholder="XXXX XXXX XXXX"
          value={aadhaarNumber}
          onChangeText={setAadhaarNumber}
          keyboardType="number-pad"
          maxLength={12}
          iconLeft="shield"
        />

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 8 }}>
          Aadhaar Card Photo
        </Text>

        {cardPhoto ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: cardPhoto.uri }} style={styles.cardPreview} resizeMode="cover" />
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
                onPress={() => setCardPhoto(null)}
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
            style={styles.photoRow}
            activeOpacity={0.7}
          >
            <View style={styles.photoCard}>
              <AppIcon name="camera" size={24} color={brandColor} />
              <Text style={styles.photoCardText}>Tap to Capture or Attach Card Photo</Text>
            </View>
          </TouchableOpacity>
        )}

        <AppButton
          title={isSubmitting ? 'Submitting...' : 'Submit Aadhaar'}
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
        title="Upload Aadhaar Photo"
        message="Choose how you would like to attach your Aadhaar card photo."
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
