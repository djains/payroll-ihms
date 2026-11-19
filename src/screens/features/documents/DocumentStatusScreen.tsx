import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DocumentStatusScreen.styles';
import {
  AppIcon,
  AppTextInput,
  AppButton,
  StatusBadge,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme';
import { staffApi } from '../../../api';
import { apiClient } from '../../../api/client';
import { apiConfig } from '../../../api/config';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface DocumentCategory {
  key: string;
  title: string;
  shortTitle: string;
  icon: string;
  color: string;
  bgColor: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  inputMaxLength?: number;
  description: string;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    key: 'adhar_card_upload',
    title: 'Aadhaar Card',
    shortTitle: 'Aadhaar Card',
    icon: 'id-card',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    inputLabel: '12-Digit Aadhaar Number',
    inputPlaceholder: 'XXXX XXXX XXXX',
    inputMaxLength: 14,
    description: 'Upload front & back clear photo with QR code.',
  },
  {
    key: 'Pan_card_upload',
    title: 'PAN Card',
    shortTitle: 'PAN Card',
    icon: 'pan-card',
    color: '#D97706',
    bgColor: '#FEF3C7',
    inputLabel: '10-Digit Alphanumeric PAN',
    inputPlaceholder: 'e.g. ABCDE1234F',
    inputMaxLength: 10,
    description: 'Income Tax PAN card photo with visible name & number.',
  },
  {
    key: 'police_verification_form',
    title: 'Police Clearance Certificate',
    shortTitle: 'Police Clearance',
    icon: 'police-shield',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    inputLabel: 'Police Certificate / Token Number',
    inputPlaceholder: 'e.g. POL-MH-2026-9812',
    inputMaxLength: 30,
    description: 'Local police verification clearance document.',
  },
  {
    key: 'bank_passbook',
    title: 'Bank Passbook / Cheque',
    shortTitle: 'Bank Passbook',
    icon: 'bank-passbook',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    inputLabel: 'Bank Account Number / IFSC',
    inputPlaceholder: 'e.g. Account Number & IFSC',
    inputMaxLength: 35,
    description: 'Bank passbook first page or cancelled cheque.',
  },
  {
    key: 'passprt_size_photo',
    title: 'Passport Size Photo',
    shortTitle: 'Passport Photo',
    icon: 'passport-photo',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    description: 'Recent colored photo with clear front-facing pose.',
  },
  {
    key: 'original_address_proof',
    title: 'Present Address Proof',
    shortTitle: 'Address Proof',
    icon: 'home',
    color: '#0EA5E9',
    bgColor: '#E0F2FE',
    inputLabel: 'Document Proof Name',
    inputPlaceholder: 'e.g. Electricity Bill, Rent Agreement',
    inputMaxLength: 50,
    description: 'Proof of present residence or permanent address.',
  },
  {
    key: 'joining_form',
    title: 'Employee Joining Kit',
    shortTitle: 'Joining Kit',
    icon: 'joining-form',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    description: 'Signed enterprise employee onboarding agreement.',
  },
];

export const DocumentStatusScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'status'>('upload');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(DOCUMENT_CATEGORIES[0]);
  const [identifierInput, setIdentifierInput] = useState('');
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);

  // States
  const [docRecords, setDocRecords] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const empName = currentUser?.name || 'Staff User';

  // Active record from SQL
  const activeRecord = docRecords[selectedCategory.key];
  const hasExistingRecord = !!activeRecord;
  const existingDocPath = activeRecord?.file_url || activeRecord?.image_path || null;
  const existingImageSource = existingDocPath ? apiClient.getImageSource(existingDocPath) : null;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await staffApi.getDocumentsStatus(empCode);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        const kyc = (res.data as any).kyc;
        const mapping: Record<string, any> = {};

        for (const item of list) {
          if (!mapping[item.image_name] || item.id > mapping[item.image_name].id) {
            mapping[item.image_name] = item;
          }
        }

        // Attach masked KYC details from hr_employee_kyc
        if (kyc) {
          if (kyc.aadhaar_masked) {
            const existing = mapping['adhar_card_upload'];
            mapping['adhar_card_upload'] = {
              ...(existing || { id: 101, image_name: 'adhar_card_upload', android_flag: 1, reject: 2 }),
              field1: existing?.field1 || `Aadhaar: ${kyc.aadhaar_masked}`,
              kyc_status: kyc.bank_status || 'Verified',
            };
          }
          if (kyc.pan_masked) {
            const existing = mapping['Pan_card_upload'];
            mapping['Pan_card_upload'] = {
              ...(existing || { id: 102, image_name: 'Pan_card_upload', android_flag: 1, reject: 2 }),
              field1: existing?.field1 || `PAN: ${kyc.pan_masked}`,
              kyc_status: kyc.bank_status || 'Verified',
            };
          }
          if (kyc.bank_account_masked) {
            const existing = mapping['bank_passbook'];
            mapping['bank_passbook'] = {
              ...(existing || { id: 103, image_name: 'bank_passbook', android_flag: 1, reject: 2 }),
              field1: existing?.field1 || `${kyc.bank_name || 'Bank'}: ${kyc.bank_account_masked} (IFSC: ${kyc.ifsc || 'N/A'})`,
              kyc_status: kyc.bank_status || 'Verified',
            };
          }
        }

        setDocRecords(mapping);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [empCode]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const approvedCount = useMemo(() => {
    return DOCUMENT_CATEGORIES.filter((cat) => {
      const r = docRecords[cat.key];
      return r && (r.reject === 2 || r.android_flag === 1 || r.source === 'hr_employee_document');
    }).length;
  }, [docRecords]);

  const totalCount = DOCUMENT_CATEGORIES.length;
  const percent = Math.round((approvedCount / totalCount) * 100);

  // When active record is loaded or category switched, pre-fill from SQL
  useEffect(() => {
    if (activeRecord) {
      if (activeRecord.field1) {
        setIdentifierInput(activeRecord.field1);
      } else {
        setIdentifierInput('');
      }
    } else {
      setIdentifierInput('');
    }
    setPickedPhoto(null);
  }, [selectedCategory.key, activeRecord?.id, activeRecord?.field1]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  // Switch category
  const handleSelectCategory = (cat: DocumentCategory) => {
    setSelectedCategory(cat);
    setPickedPhoto(null);
  };

  // Camera Picker
  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setPickedPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `${selectedCategory.key}_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Attached',
            message: `New photo chosen for ${selectedCategory.shortTitle}.`,
          });
        }
      });
    }, 250);
  };

  // Gallery Picker
  const openGalleryPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setPickedPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `${selectedCategory.key}_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Photo Selected',
            message: `New photo chosen for ${selectedCategory.shortTitle}.`,
          });
        }
      });
    }, 250);
  };

  // Submit / Update Document
  const handleSubmit = async () => {
    if (!pickedPhoto && !existingImageSource) {
      showToast({
        type: 'warning',
        title: 'Photo Required',
        message: 'Please take or attach a photo of the document.',
      });
      return;
    }

    if (selectedCategory.inputLabel && !identifierInput.trim()) {
      showToast({
        type: 'warning',
        title: 'Missing Details',
        message: `Please enter the ${selectedCategory.inputLabel}.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('emp_code', empCode);
      formData.append('emp_name', empName);
      formData.append('image_name', selectedCategory.key);
      if (identifierInput.trim()) {
        formData.append('field1', identifierInput.trim());
      }
      if (pickedPhoto) {
        formData.append('file', {
          uri: pickedPhoto.uri,
          name: pickedPhoto.name,
          type: pickedPhoto.type,
        } as any);
      }

      const res = await staffApi.uploadDocument(formData);

      // Best effort sync for KYC
      if (selectedCategory.key === 'adhar_card_upload') {
        try {
          await staffApi.submitKyc({ emp_code: empCode, aadhaar: identifierInput.trim() });
        } catch {}
      } else if (selectedCategory.key === 'Pan_card_upload') {
        try {
          await staffApi.submitKyc({ emp_code: empCode, pan: identifierInput.trim().toUpperCase() });
        } catch {}
      }

      if (res.success) {
        showToast({
          type: 'success',
          title: hasExistingRecord ? 'Document Updated' : 'Document Submitted',
          message: `${selectedCategory.title} ${hasExistingRecord ? 'updated' : 'submitted'} successfully.`,
        });
        setPickedPhoto(null);
        await fetchStatus();
        setActiveTab('status');
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
        message: e?.message || 'Network error while submitting document.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Circular Edge-to-Edge Header Bar (NO Right Action Buttons) ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.circularBackBtn}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <AppIcon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documents & KYC</Text>
        </View>

        {/* Clean right placeholder to keep spacing neat */}
        <View style={styles.headerPlaceholderRight} />
      </View>

      {/* ── Segmented Tabs (Dashboard Style) ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'upload' && styles.tabItemActive]}
          onPress={() => setActiveTab('upload')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>
            {hasExistingRecord ? 'Update Document' : 'Upload Document'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'status' && styles.tabItemActive]}
          onPress={() => setActiveTab('status')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'status' && styles.tabTextActive]}>
            My Records ({approvedCount}/{totalCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandColor]} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'upload' ? (
          /* ══════════ TAB 1: UPLOAD / UPDATE DOCUMENT ══════════ */
          <>
            {/* Horizontal Scrollable Document Carousel */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Select Document</Text>
              <Text style={styles.sectionHint}>Swipe to view all</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.docTypeScroll}
            >
              {DOCUMENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.key === cat.key;
                const rec = docRecords[cat.key];
                const isApproved = rec?.reject === 2;
                const isPending = rec && rec.reject === 0;

                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.docTypeCard, isSelected && [styles.docTypeCardActive, { borderColor: brandColor }]]}
                    onPress={() => handleSelectCategory(cat)}
                    activeOpacity={0.8}
                  >
                    {/* Active checkmark badge */}
                    {isSelected && (
                      <View style={[styles.activeCheckBadge, { backgroundColor: brandColor }]}>
                        <AppIcon name="check" size={10} color="#FFFFFF" />
                      </View>
                    )}

                    {/* Pre-existing upload status dot */}
                    {!isSelected && isApproved && (
                      <View style={[styles.statusDotBadge, { backgroundColor: '#16A34A' }]} />
                    )}
                    {!isSelected && isPending && (
                      <View style={[styles.statusDotBadge, { backgroundColor: '#D97706' }]} />
                    )}

                    {/* Dashboard-style icon wrap */}
                    <View
                      style={[
                        styles.docIconWrap,
                        {
                          backgroundColor: isSelected ? cat.color : cat.bgColor,
                        },
                      ]}
                    >
                      <AppIcon
                        name={cat.icon as any}
                        size={22}
                        color={isSelected ? '#FFFFFF' : cat.color}
                      />
                    </View>

                    <Text
                      style={[
                        styles.docTypeCardTitle,
                        isSelected && styles.docTypeCardTitleActive,
                      ]}
                      numberOfLines={2}
                    >
                      {cat.shortTitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.container}>
              {/* Form Card (Dashboard Tile Style) */}
              <View style={styles.formCard}>
                <View style={styles.formCardHeader}>
                  <View style={[styles.formCardIconBox, { backgroundColor: selectedCategory.bgColor }]}>
                    <AppIcon name={selectedCategory.icon as any} size={22} color={selectedCategory.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formCardTitle}>{selectedCategory.title}</Text>
                    <Text style={styles.formCardDesc}>{selectedCategory.description}</Text>
                  </View>
                </View>

                {/* Live Pre-existing Submission Status Banner from SQL */}
                {hasExistingRecord && (
                  <View style={styles.currentStatusRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={[
                          styles.statusMiniDot,
                          {
                            backgroundColor:
                              activeRecord.reject === 2
                                ? '#16A34A'
                                : activeRecord.reject === 1
                                ? '#EF4444'
                                : '#D97706',
                          },
                        ]}
                      />
                      <Text style={styles.currentStatusText}>
                        {activeRecord.reject === 2
                          ? 'Approved by HR'
                          : activeRecord.reject === 1
                          ? 'Rejected by HR'
                          : 'Submitted & Under Review'}
                      </Text>
                    </View>
                    {activeRecord.field1 ? (
                      <Text style={styles.currentIdentifierText}>Saved: {activeRecord.field1}</Text>
                    ) : null}
                  </View>
                )}

                {/* Identifier Input (Pre-filled from SQL if already submitted) */}
                {selectedCategory.inputLabel ? (
                  <AppTextInput
                    label={selectedCategory.inputLabel}
                    placeholder={selectedCategory.inputPlaceholder || ''}
                    value={identifierInput}
                    onChangeText={setIdentifierInput}
                    maxLength={selectedCategory.inputMaxLength}
                    autoCapitalize={selectedCategory.key === 'Pan_card_upload' ? 'characters' : 'none'}
                    keyboardType={selectedCategory.key === 'adhar_card_upload' ? 'number-pad' : 'default'}
                    iconLeft={selectedCategory.icon as any}
                  />
                ) : null}

                {/* Clean Image Preview (Fetched from SQL or newly picked) or Dropzone */}
                {pickedPhoto || existingImageSource ? (
                  <View style={styles.previewCard}>
                    <Image
                      source={pickedPhoto ? { uri: pickedPhoto.uri } : existingImageSource!}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.previewActionRow}>
                      <TouchableOpacity
                        style={styles.changePhotoBtn}
                        onPress={() => setIsPhotoPickerOpen(true)}
                        activeOpacity={0.75}
                      >
                        <AppIcon name="camera" size={15} color="#0F172A" />
                        <Text style={styles.changePhotoText}>
                          {pickedPhoto ? 'Change Selected' : 'Upload New Photo'}
                        </Text>
                      </TouchableOpacity>

                      {pickedPhoto ? (
                        <TouchableOpacity
                          style={styles.removePhotoBtn}
                          onPress={() => setPickedPhoto(null)}
                          activeOpacity={0.75}
                        >
                          <AppIcon name="trash" size={15} color="#EF4444" />
                          <Text style={styles.removePhotoText}>Cancel</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <AppIcon name="check" size={12} color="#16A34A" />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>Photo on File</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoDropzone}
                    onPress={() => setIsPhotoPickerOpen(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.dropzoneIconCircle}>
                      <AppIcon name="camera" size={24} color={selectedCategory.color} />
                    </View>
                    <Text style={styles.dropzoneTitle}>Tap to photograph or select file</Text>
                    <Text style={styles.dropzoneSubtitle}>Supports Camera Photo, JPG, PNG & PDF</Text>
                  </TouchableOpacity>
                )}

                <AppButton
                  title={
                    isSubmitting
                      ? 'Saving Updates...'
                      : hasExistingRecord
                      ? `Update ${selectedCategory.shortTitle}`
                      : `Submit ${selectedCategory.shortTitle}`
                  }
                  onPress={handleSubmit}
                  iconLeft={isSubmitting ? undefined : 'check'}
                  disabled={isSubmitting}
                  style={styles.submitBtn}
                  customColor={brandColor}
                />
              </View>
            </View>
          </>
        ) : (
          /* ══════════ TAB 2: MY STATUS & COMPLIANCE ══════════ */
          <View style={styles.container}>
            {/* Compliance Banner */}
            <View style={styles.complianceBanner}>
              <View style={styles.complianceInfo}>
                <View style={styles.complianceHeaderRow}>
                  <View style={styles.complianceIconCircle}>
                    <AppIcon name="shield" size={13} color={percent === 100 ? '#16A34A' : brandColor} />
                  </View>
                  <Text style={styles.complianceTitle} numberOfLines={1}>
                    Dossier Compliance
                  </Text>
                </View>
                <Text style={styles.complianceSubtitle} numberOfLines={1}>
                  {approvedCount} of {totalCount} mandatory documents approved
                </Text>
                {/* Visual Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percent}%`,
                        backgroundColor: percent === 100 ? '#16A34A' : brandColor,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={[styles.complianceBadge, { backgroundColor: percent === 100 ? '#16A34A' : brandColor }]}>
                <Text style={styles.compliancePercent}>{percent}%</Text>
                <Text style={styles.complianceLabel}>
                  {percent === 100 ? 'COMPLIANT' : 'VERIFIED'}
                </Text>
              </View>
            </View>

            {loading && !refreshing && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={brandColor} />
                <Text style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>Loading records...</Text>
              </View>
            )}

            {/* Document Status Cards */}
            {DOCUMENT_CATEGORIES.map((doc) => {
              const rec = docRecords[doc.key];
              const isUploaded = !!rec && (!!rec.file_url || !!rec.image_path || !!rec.field1);
              const isRejected = rec?.reject === 1;
              const isPending =
                isUploaded &&
                !isRejected &&
                (rec?.reject === 0 || rec?.reject === null || rec?.reject === undefined);
              const isApproved =
                isUploaded &&
                !isRejected &&
                !isPending &&
                (rec?.reject === 2 || rec?.source === 'hr_employee_document');

              const statusVal: 'approved' | 'pending' | 'rejected' = isApproved
                ? 'approved'
                : isRejected
                ? 'rejected'
                : 'pending';

              const statusLabel = isApproved
                ? 'Approved / Verified'
                : isRejected
                ? 'Rejected'
                : isUploaded
                ? 'Pending Review'
                : 'Not Uploaded';

              const accentColor = isApproved
                ? '#16A34A'
                : isRejected
                ? '#EF4444'
                : isUploaded
                ? '#D97706'
                : '#94A3B8';

              const remarksText = isApproved
                ? rec?.comments || rec?.kyc_status || 'Document verified & approved on enterprise portal.'
                : isRejected
                ? rec?.comments || 'Rejected. Please re-upload clear photo.'
                : isUploaded
                ? rec?.comments || 'Uploaded. Administrative review in progress.'
                : 'Document not yet submitted.';

              let docIdentifier = 'Pending upload';
              if (rec?.field1) {
                docIdentifier = rec.field1;
              } else if (rec?.document_type) {
                docIdentifier = `${rec.document_type} (Verified)`;
              } else if (rec?.file_name) {
                docIdentifier = `File: ${rec.file_name}`;
              } else if (rec?.file_url || rec?.image_path) {
                docIdentifier = 'Document Photo on Record';
              }

              const docPath = rec?.file_url || rec?.image_path;
              const docImgSource = docPath ? apiClient.getImageSource(docPath) : null;
              const isPdf = !!docPath && docPath.toLowerCase().endsWith('.pdf');

              return (
                <View key={doc.key} style={styles.docStatusCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.docIconBox, { backgroundColor: doc.bgColor }]}>
                        <AppIcon name={doc.icon as any} size={20} color={doc.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docCardTitle}>{doc.title}</Text>
                        <Text style={styles.docCardIdentifier}>{docIdentifier}</Text>
                      </View>
                    </View>
                    <StatusBadge status={statusVal} label={statusLabel} />
                  </View>

                  {/* Document Thumbnail Preview (If file exists) */}
                  {docImgSource && !isPdf ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        setPreviewDoc({
                          url: docPath,
                          title: doc.title,
                          subtitle: docIdentifier,
                        })
                      }
                      style={styles.docThumbContainer}
                    >
                      <View style={styles.docThumbImgWrap}>
                        <Image source={docImgSource} style={styles.docThumbImg} resizeMode="cover" />
                        <View style={styles.docZoomPill}>
                          <AppIcon name="search" size={10} color="#FFFFFF" />
                          <Text style={styles.docZoomText}>View Full Photo</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : isPdf ? (
                    <View style={[styles.docThumbContainer, { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                      <AppIcon name="document" size={24} color="#EF4444" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>PDF Document Attached</Text>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>{docIdentifier}</Text>
                      </View>
                    </View>
                  ) : null}

                  {rec?.uploaded_at || rec?.cur_date ? (
                    <Text style={styles.dateText}>
                      Date: {rec.uploaded_at ? new Date(rec.uploaded_at).toLocaleDateString('en-IN') : rec.cur_date}
                    </Text>
                  ) : null}

                  <View style={[styles.remarksBox, { borderLeftColor: accentColor }]}>
                    <Text style={[styles.remarksLabel, { color: accentColor }]}>
                      {isApproved ? 'HR Verification' : isRejected ? 'Rejection Reason' : 'Status'}
                    </Text>
                    <Text style={styles.remarksText}>{remarksText}</Text>
                  </View>

                  <View style={styles.quickActionRow}>
                    {docImgSource && !isPdf ? (
                      <TouchableOpacity
                        style={[styles.quickUploadBtn, { borderColor: '#CBD5E1', marginRight: 8 }]}
                        onPress={() =>
                          setPreviewDoc({
                            url: docPath,
                            title: doc.title,
                            subtitle: docIdentifier,
                          })
                        }
                        activeOpacity={0.75}
                      >
                        <AppIcon name="search" size={12} color="#475569" />
                        <Text style={[styles.quickUploadText, { color: '#475569' }]}>View Photo</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.quickUploadBtn,
                        {
                          borderColor: isRejected
                            ? '#EF4444'
                            : isApproved
                            ? '#0D9488'
                            : isPending
                            ? '#D97706'
                            : brandColor,
                        },
                      ]}
                      onPress={() => {
                        setSelectedCategory(doc);
                        setActiveTab('upload');
                      }}
                      activeOpacity={0.75}
                    >
                      <AppIcon
                        name="camera"
                        size={12}
                        color={
                          isRejected
                            ? '#EF4444'
                            : isApproved
                            ? '#0D9488'
                            : isPending
                            ? '#D97706'
                            : brandColor
                        }
                      />
                      <Text
                        style={[
                          styles.quickUploadText,
                          {
                            color: isRejected
                              ? '#EF4444'
                              : isApproved
                              ? '#0D9488'
                              : isPending
                              ? '#D97706'
                              : brandColor,
                          },
                        ]}
                      >
                        {isRejected
                          ? 'Re-Upload Now'
                          : isApproved
                          ? 'Update / Re-Upload'
                          : isPending
                          ? 'Change Photo'
                          : 'Upload Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Document Fullscreen Zoom Modal ── */}
      <Modal
        visible={!!previewDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={styles.zoomModalOverlay}>
          <View style={styles.zoomModalContent}>
            <View style={styles.zoomModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.zoomModalTitle}>{previewDoc?.title}</Text>
                {previewDoc?.subtitle ? (
                  <Text style={styles.zoomModalSubtitle}>{previewDoc.subtitle}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.zoomCloseBtn}
                onPress={() => setPreviewDoc(null)}
                activeOpacity={0.7}
              >
                <AppIcon name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {previewDoc?.url ? (
              <Image
                source={apiClient.getImageSource(previewDoc.url)!}
                style={styles.zoomLargeImage}
                resizeMode="contain"
              />
            ) : null}

            <View style={styles.zoomModalFooter}>
              <AppButton
                title="Close Preview"
                variant="outline"
                onPress={() => setPreviewDoc(null)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Camera / Gallery Modal ── */}
      <CustomAlertModal
        visible={isPhotoPickerOpen}
        title={`Upload ${selectedCategory.shortTitle}`}
        message="Take a photo with your camera or select an existing document from your gallery."
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
    </SafeAreaView>
  );
};
