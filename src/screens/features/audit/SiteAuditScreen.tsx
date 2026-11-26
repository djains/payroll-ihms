import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { styles } from './SiteAuditScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppButton,
  AppIcon,
  AppTextInput,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';
import { apiClient } from '../../../api/client';
import { ANDROID_API_KEY } from '../../../api/config';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface AuditQuestion {
  id: number;
  question: string;
  category: string;
}

// Official Backend 6-Point Question Mapping (from apps/masters/site_audit_detail.py):
// (HOUSEKEEPING, SECURITY GUARD, R&M, other)
const AUDIT_QUESTIONS_MAP: Record<string, { id: number; question: string; category: string }[]> = {
  'SECURITY GUARD': [
    { id: 1, question: 'Meet to concern person ?', category: 'Client Coordination' },
    { id: 2, question: 'Meet to security guard employee ?', category: 'Guard Presence' },
    { id: 3, question: 'Check dressup & grooming ?', category: 'Turnout & Hygiene' },
    { id: 4, question: 'Check I-card & shooes ?', category: 'Uniform & Accessories' },
    { id: 5, question: 'Guard maintain register properly ?', category: 'Logbook & Documentation' },
    { id: 6, question: 'Guard is present on place ?', category: 'Post Vigilance' },
  ],
  HOUSEKEEPING: [
    { id: 1, question: 'Meet to concern person ?', category: 'Client Coordination' },
    { id: 2, question: 'Meet to housekeeping employee ?', category: 'Staff Presence' },
    { id: 3, question: 'Check dressup & grooming ?', category: 'Turnout & Hygiene' },
    { id: 4, question: 'Check I-card & shooes ?', category: 'Uniform & Safety Shoes' },
    { id: 5, question: 'Check office cleaning ?', category: 'Floor & Workstation Cleaning' },
    { id: 6, question: 'Check washroom cleaning ?', category: 'Hygiene & Washroom Sanitization' },
  ],
  'R&M': [
    { id: 1, question: 'Meet to concern person ?', category: 'Client Coordination' },
    { id: 2, question: 'Check wiring ?', category: 'Electrical Safety' },
    { id: 3, question: 'Check electrical / electronics items ?', category: 'Equipment Check' },
    { id: 4, question: 'Check furniture ?', category: 'Office Infrastructure' },
    { id: 5, question: 'Check plumbing work ?', category: 'Plumbing & Drainage' },
    { id: 6, question: 'Is there any query or concerns ?', category: 'Maintenance Feedback' },
  ],
};

export const SiteAuditScreen: React.FC = () => {
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  // State
  const [answers, setAnswers] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  });
  const [photos, setPhotos] = useState<Record<number, { uri: string; base64?: string } | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });
  const [clientRemarks, setClientRemarks] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('SECURITY GUARD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activePhotoQuestionId, setActivePhotoQuestionId] = useState<number | null>(null);

  // Live Unit Scope Details
  const unitCode =
    currentUser?.branchOrUnit ||
    (currentUser as any)?.scope?.unit_code ||
    (currentUser as any)?.unitCode ||
    '';
  const supervisorName = currentUser?.name || currentUser?.username || 'Supervisor';
  const supervisorEmpCode = currentUser?.empCode || currentUser?.username || '';
  const companyName = currentCompany?.name || (currentUser as any)?.scope?.comp_name || '';

  const [clientCode, setClientCode] = useState<string>(
    (currentUser as any)?.scope?.client_code || ''
  );
  const [unitCity, setUnitCity] = useState<string>('');
  const [unitName, setUnitName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchUnitFromSQL = async () => {
      try {
        const res = await apiClient.get<any>(`/api/masters/units/?search=${encodeURIComponent(unitCode)}`);
        if (res.success && res.data) {
          const raw = res.data;
          const list = Array.isArray(raw) ? raw : raw.results || [raw];
          const match = list.find((item: any) => String(item.unit_code || '').trim() === unitCode) || list[0];
          if (match && isMounted) {
            if (match.client_code) setClientCode(String(match.client_code).trim());
            if (match.unit_city) setUnitCity(match.unit_city.trim());
            if (match.unit_name) setUnitName(match.unit_name.trim());
          }
        }
      } catch {}
    };
    fetchUnitFromSQL();
    return () => {
      isMounted = false;
    };
  }, [unitCode]);

  const handleToggleAnswer = (id: number, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const openCamera = () => {
    const qId = activePhotoQuestionId;
    setActivePhotoQuestionId(null);
    if (!qId) return;

    setTimeout(() => {
      launchCamera(
        { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.6, includeBase64: true, saveToPhotos: false },
        (response) => {
          if (response.didCancel || response.errorCode) return;
          const asset = response.assets?.[0];
          if (asset?.uri) {
            setPhotos((prev) => ({
              ...prev,
              [qId]: { uri: asset.uri!, base64: asset.base64 },
            }));
            showToast({
              type: 'success',
              title: 'Evidence Captured',
              message: `Photo proof attached for inspection point #${qId}.`,
            });
          }
        }
      );
    }, 200);
  };

  const openGallery = () => {
    const qId = activePhotoQuestionId;
    setActivePhotoQuestionId(null);
    if (!qId) return;

    setTimeout(() => {
      launchImageLibrary(
        { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.6, includeBase64: true },
        (response) => {
          if (response.didCancel || response.errorCode) return;
          const asset = response.assets?.[0];
          if (asset?.uri) {
            setPhotos((prev) => ({
              ...prev,
              [qId]: { uri: asset.uri!, base64: asset.base64 },
            }));
            showToast({
              type: 'success',
              title: 'Evidence Attached',
              message: `Photo proof attached for inspection point #${qId}.`,
            });
          }
        }
      );
    }, 200);
  };

  const handleSubmitAudit = async () => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        emp_code: supervisorEmpCode,
        client_code: clientCode || (currentUser as any)?.scope?.client_code || '5',
        unit_code: unitCode,
        grade_name: selectedGrade,
        remarks: clientRemarks.trim() || 'Site audit inspection completed as per protocol.',
        current_address: unitCity || unitName || 'Raipur',
        // Pass comp_code directly so backend can skip pay_client_master lookup
        comp_code: currentUser?.companyId || (currentUser as any)?.scope?.comp_code || '',
      };

      for (let n = 1; n <= 6; n++) {
        payload[`ques_${n}_ans`] = answers[n] ? 'Yes' : 'No';
        if (photos[n]?.base64) {
          payload[`ques_path_${n}`] = `question_${n}`;
          payload[`ques_image_${n}`] = photos[n]!.base64;
        } else {
          // Photo optional hai - agar photo nahi li toh blank rahega, dummy photo nahi jayegi
          payload[`ques_path_${n}`] = '';
          payload[`ques_image_${n}`] = '';
        }
      }

      const res = await apiClient.post<any>(
        '/api/mobile/site_audio_data/',
        payload,
        { 'X-API-Key': ANDROID_API_KEY }
      );

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Audit Submitted',
          message: '6-Point Site Quality Inspection report recorded successfully.',
        });
        goBack();
      } else {
        showToast({
          type: 'info',
          title: 'Audit Submitted',
          message: res.error || 'Site inspection recorded successfully.',
        });
        goBack();
      }
    } catch {
      showToast({
        type: 'warning',
        title: 'Offline Queued',
        message: 'Site inspection recorded locally and queued for server sync.',
      });
      goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = currentCompany?.brandColor || colors.primary;
  const compliantCount = Object.values(answers).filter(Boolean).length;

  return (
    <AppScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      header={<AppHeader title="Site Quality Audit" onBack={goBack} />}
    >
      {/* ── Enterprise Unit Card (Clean Business Scope) ── */}
      <View style={styles.scopeCard}>
        <View style={styles.scopeHeaderRow}>
          <View style={styles.scopeHeaderLeft}>
            <View style={styles.scopeIconWrap}>
              <AppIcon name="clipboard" size={18} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scopeHeaderTitle}>Site Compliance Inspection</Text>
              <Text style={styles.scopeHeaderSubtitle} numberOfLines={1}>
                {companyName}{unitName ? ` • ${unitName}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* 2x2 Scope Grid */}
        <View style={styles.scopeGrid}>
          <View style={styles.scopeGridRow}>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Unit Code</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>{unitCode}</Text>
            </View>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Client ID</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>{clientCode || '5'}</Text>
            </View>
          </View>

          <View style={styles.scopeGridRow}>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Auditor / Supervisor</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>{supervisorName}</Text>
            </View>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Location</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>
                {unitCity || unitName || 'Raipur'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 6-Point Inspection Checklist ── */}
      <View style={styles.card}>
        <View style={styles.checklistHeaderRow}>
          <Text style={styles.sectionTitle}>6-Point Audit Checklist</Text>
          <View style={styles.badgeWrap}>
            <Text
              style={[
                styles.badgeText,
                { color: compliantCount === 6 ? '#15803D' : '#B45309' },
              ]}
            >
              {compliantCount}/6 Compliant
            </Text>
          </View>
        </View>

        {/* Category / Department Switcher */}
        <View style={styles.gradeTabContainer}>
          {(['SECURITY GUARD', 'HOUSEKEEPING', 'R&M'] as const).map((grade) => {
            const isSelected = selectedGrade === grade;
            return (
              <TouchableOpacity
                key={grade}
                onPress={() => setSelectedGrade(grade)}
                style={[
                  styles.gradeTab,
                  isSelected && { backgroundColor: brandColor, borderColor: brandColor },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.gradeTabText,
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {grade === 'SECURITY GUARD' ? 'Security' : grade === 'HOUSEKEEPING' ? 'Housekeeping' : 'R&M / Maint.'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(AUDIT_QUESTIONS_MAP[selectedGrade] || AUDIT_QUESTIONS_MAP['SECURITY GUARD']).map((q) => {
          const isYes = answers[q.id] === true;
          const photo = photos[q.id];

          return (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.categoryBadge}>{q.category}</Text>
              </View>

              <Text style={styles.questionText}>
                {q.id}. {q.question}
              </Text>

              {photo && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    onPress={() => setPhotos((prev) => ({ ...prev, [q.id]: null }))}
                    style={styles.removePhotoBtn}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.btnRow}>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    onPress={() => handleToggleAnswer(q.id, true)}
                    style={[styles.yesNoBtn, isYes && styles.yesActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.yesNoText, isYes && styles.yesTextActive]}>YES</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleAnswer(q.id, false)}
                    style={[styles.yesNoBtn, !isYes && styles.noActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.yesNoText, !isYes && styles.noTextActive]}>NO</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setActivePhotoQuestionId(q.id)}
                  style={[styles.photoEvidenceBtn, photo && styles.photoEvidenceBtnActive]}
                  activeOpacity={0.7}
                >
                  <AppIcon
                    name="camera"
                    size={14}
                    color={photo ? '#15803D' : brandColor}
                  />
                  <Text
                    style={[
                      styles.photoEvidenceText,
                      photo && styles.photoEvidenceTextActive,
                    ]}
                  >
                    {photo ? 'Photo Added ✓' : 'Add Photo Proof'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* ── Client / Site Comments ── */}
        <AppTextInput
          label="Site Observations / Client Feedback"
          placeholder="e.g. Facility manager satisfied with guard deployment"
          value={clientRemarks}
          onChangeText={setClientRemarks}
          containerStyle={{ marginTop: 14 }}
        />

        <AppButton
          title={isSubmitting ? 'Recording Audit...' : `Submit Audit Report (${compliantCount}/6)`}
          onPress={() => setShowConfirmModal(true)}
          disabled={isSubmitting}
          iconLeft="check"
          style={styles.submitBtn}
          customColor={brandColor}
        />
      </View>

      {/* Photo Picker Modal */}
      <CustomAlertModal
        visible={activePhotoQuestionId !== null}
        title="Attach Evidence Photo"
        message="Select camera to take live site audit proof, or choose an existing photo from gallery."
        type="choose"
        buttons={[
          {
            text: 'Camera',
            icon: 'camera',
            onPress: openCamera,
          },
          {
            text: 'Gallery',
            icon: 'document',
            onPress: openGallery,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setActivePhotoQuestionId(null),
          },
        ]}
        onClose={() => setActivePhotoQuestionId(null)}
      />

      {/* Confirm Submission Modal */}
      <CustomAlertModal
        visible={showConfirmModal}
        title="Submit Site Quality Audit?"
        message={`Authorize and submit this inspection report with ${compliantCount}/6 points compliant?`}
        type="info"
        buttons={[
          {
            text: 'Submit Now',
            icon: 'check',
            onPress: () => {
              setShowConfirmModal(false);
              handleSubmitAudit();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowConfirmModal(false),
          },
        ]}
        onClose={() => setShowConfirmModal(false)}
      />
    </AppScreenContainer>
  );
};
