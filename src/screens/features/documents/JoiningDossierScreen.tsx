import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './JoiningDossierScreen.styles';
import { AppScreenContainer, AppHeader, AppButton, AppIcon, CustomAlertModal, StatusBadge } from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';
import { staffApi } from '../../../api';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface DossierStep {
  id: number;
  key: string;
  title: string;
  desc: string;
}

const DOSSIER_STEPS: DossierStep[] = [
  { id: 1, key: 'passprt_size_photo', title: 'Passport Size Photo', desc: 'White background, clean face' },
  { id: 2, key: 'adhar_card_upload', title: 'Aadhaar Card Copy', desc: 'Front & back with QR code' },
  { id: 3, key: 'Pan_card_upload', title: 'PAN Card Copy', desc: 'Legible 10-digit number' },
  { id: 4, key: 'bank_passbook', title: 'Bank Passbook / Cheque', desc: 'Account number & IFSC clearly visible' },
  { id: 5, key: 'original_address_proof', title: 'Permanent Address Proof', desc: 'Electricity bill / Voter ID' },
  { id: 6, key: 'joining_form', title: 'Joining Form', desc: 'Signed employee joining form' },
  { id: 7, key: 'police_verification_form', title: 'Police Clearance Certificate', desc: 'Local police station verification' },
];

export const JoiningDossierScreen: React.FC = () => {
  const [docMap, setDocMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeUploadDoc, setActiveUploadDoc] = useState<DossierStep | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  useEffect(() => {
    fetchDossierStatus();
  }, []);

  const fetchDossierStatus = async () => {
    setLoading(true);
    try {
      const empCode = currentUser?.empCode || currentUser?.username || '';
      const res = await staffApi.getDocumentsStatus(empCode);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        const mapping: Record<string, any> = {};
        for (const item of list) {
          // keep latest by image_name
          if (!mapping[item.image_name] || item.id > mapping[item.image_name].id) {
            mapping[item.image_name] = item;
          }
        }
        setDocMap(mapping);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPicker = (step: DossierStep) => {
    setActiveUploadDoc(step);
    setIsPhotoPickerOpen(true);
  };

  const processUpload = async (photo: { uri: string; name: string; type: string }) => {
    if (!activeUploadDoc) return;
    setIsUploading(true);
    try {
      const empCode = currentUser?.empCode || currentUser?.username || '';
      const empName = currentUser?.name || 'Staff User';

      const formData = new FormData();
      formData.append('emp_code', empCode);
      formData.append('emp_name', empName);
      formData.append('image_name', activeUploadDoc.key);
      formData.append('file', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      } as any);

      const res = await staffApi.uploadDocument(formData);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Document Uploaded',
          message: `${activeUploadDoc.title} uploaded successfully.`,
        });
        await fetchDossierStatus();
      } else {
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: res.error || 'Failed to upload document. Please retry.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Upload Error',
        message: e?.message || 'Network error while uploading.',
      });
    } finally {
      setIsUploading(false);
      setActiveUploadDoc(null);
    }
  };

  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          processUpload({
            uri: asset.uri || '',
            name: asset.fileName || `${activeUploadDoc?.key || 'doc'}_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
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
          processUpload({
            uri: asset.uri || '',
            name: asset.fileName || `${activeUploadDoc?.key || 'doc'}_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
        }
      });
    }, 250);
  };

  const brandColor = currentCompany?.brandColor || colors.primary;

  const uploadedCount = DOSSIER_STEPS.filter((step) => {
    const rec = docMap[step.key];
    return rec && rec.reject !== 1;
  }).length;

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container}>
      <AppHeader
        title="Joining Document Dossier"
        onBack={goBack}
      />

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
            Required Joining Documents ({uploadedCount}/7 Completed)
          </Text>
          {loading && <ActivityIndicator size="small" color={brandColor} />}
        </View>

        {DOSSIER_STEPS.map((step) => {
          const rec = docMap[step.key];
          const isApproved = rec?.reject === 2;
          const isPending = rec?.reject === 0;
          const isRejected = rec?.reject === 1;
          const isDone = isApproved || isPending;

          return (
            <View key={step.id} style={styles.docRow}>
              <View style={styles.docLeft}>
                <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                  {isDone ? (
                    <AppIcon name="check" size={14} color={isApproved ? colors.success : colors.warning} />
                  ) : (
                    <Text style={styles.stepNum}>{step.id}</Text>
                  )}
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.docName}>{step.title}</Text>
                  <Text style={styles.docDesc}>{step.desc}</Text>
                  {rec?.comments ? (
                    <Text style={{ fontSize: 11, color: isRejected ? colors.danger : colors.textMuted, marginTop: 2 }}>
                      {rec.comments}
                    </Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenPicker(step)}
                disabled={isUploading || isApproved}
                style={[
                  styles.uploadActionBtn,
                  isApproved && styles.uploadActionDone,
                  isRejected && { backgroundColor: colors.dangerLight },
                  isPending && { backgroundColor: colors.warningLight },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.uploadActionText,
                    isApproved && { color: colors.success },
                    isRejected && { color: colors.danger },
                    isPending && { color: colors.warning },
                  ]}
                >
                  {isApproved ? 'Approved ✓' : isPending ? 'In Review' : isRejected ? 'Re-Upload' : 'Upload'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Camera / Gallery Selection Modal */}
      <CustomAlertModal
        visible={isPhotoPickerOpen}
        title={`Upload ${activeUploadDoc?.title || 'Document'}`}
        message="Choose how you would like to photograph or attach this document."
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
