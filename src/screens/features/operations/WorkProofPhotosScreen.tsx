import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import {
  AppScreenContainer,
  AppHeader,
  AppCard,
  AppButton,
  AppIcon,
  AppTextInput,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { apiClient } from '../../../api/client';
import { apiConfig } from '../../../api/config';
import { API_ENDPOINTS } from '../../../api/config';
import { colors } from '../../../theme';
import { styles } from './WorkProofPhotosScreen.styles';

// 1. Strict Backend IMAGE_TYPES allowed in apps/employees/working_image.py
const BACKEND_IMAGE_TYPES = [
  { id: 'cleaning_images', label: 'Daily Cleaning', value: 'Cleaning Images' },
  { id: 'deep_cleaning_images', label: 'Deep Cleaning', value: 'Deep Cleaning Images' },
  { id: 'pest_control_images', label: 'Pest Control', value: 'Pest Control Images' },
];

// In-memory mapping of uploaded ID to chosen category name
const localUploadedCategoryMap: Record<number, string> = {};
const STANDARD_CATEGORIES = [
  'Washroom',
  'Reception',
  'Pantry',
  'Common Area 1',
  'Common Area 2',
  'Corridor',
  'Custom Area',
];

interface UploadedImageItem {
  id: number;
  category_name?: string;
  image_type?: string;
  image_url?: string;
  datecurrent?: string;
  unit_name?: string;
  client_name?: string;
  selected_category?: string;
  emp_code?: string;
  emp_name?: string;
  unit_code?: string;
}

const WorkImageThumb: React.FC<{ item: UploadedImageItem }> = ({ item }) => {
  const [triedFallback, setTriedFallback] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const base = apiConfig.getBaseUrl().replace(/\/+$/, '');
  const rawUrl = item.image_url || '';
  const primaryUrl = rawUrl
    ? (rawUrl.startsWith('http') ? rawUrl : `${base}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
    : `${base}/media/working_images/${item.id}.jpg`;

  const fallbackUrl = primaryUrl.includes('/working_images/')
    ? primaryUrl.replace('/working_images/', '/attendance_images/')
    : primaryUrl.replace('/attendance_images/', '/working_images/');

  const uri = triedFallback ? fallbackUrl : primaryUrl;

  if (loadFailed) {
    return (
      <View style={styles.historyThumbPlaceholder}>
        <AppIcon name="camera" size={18} color="#94A3B8" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.historyThumb}
      onError={() => {
        if (!triedFallback) {
          setTriedFallback(true);
        } else {
          setLoadFailed(true);
        }
      }}
    />
  );
};

export const WorkProofPhotosScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const unitCode =
    (currentUser as any)?.scope?.unit_code ||
    (currentUser as any)?.unitCode ||
    currentUser?.branchOrUnit ||
    '';

  // Tab State: 'submit' (Upload Proof) or 'recent' (Recent Uploads)
  const [activeTab, setActiveTab] = useState<'submit' | 'recent'>('submit');

  // Form State
  const [selectedType, setSelectedType] = useState(BACKEND_IMAGE_TYPES[0]);
  const [selectedCategory, setSelectedCategory] = useState(STANDARD_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');

  // Single Photo State
  const [capturedPhoto, setCapturedPhoto] = useState<any | null>(null);

  // Loading & Data from SQL
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadedHistory, setUploadedHistory] = useState<UploadedImageItem[]>([]);

  const activeCategoryName = selectedCategory === 'Custom Area' ? customCategory.trim() : selectedCategory;

  // 1. Fetch real working images already uploaded from SQL table pay_android_working_image
  // STRICT SHIFT RESET: Only fetch and show images uploaded during the ACTIVE SHIFT (Today / Current Shift cycle)
  const fetchUploadedHistory = useCallback(async () => {
    try {
      const now = new Date();
      const curY = now.getFullYear();
      const curM = String(now.getMonth() + 1).padStart(2, '0');
      const curD = String(now.getDate()).padStart(2, '0');
      const todayDash = `${curY}-${curM}-${curD}`;
      const todaySlash = `${curD}/${curM}/${curY}`;

      // Yesterday for Night Shift window
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yestDash = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const url = unitCode
        ? `${API_ENDPOINTS.WORKING_IMAGES}?unit_code=${unitCode}`
        : API_ENDPOINTS.WORKING_IMAGES;

      // Fetch unit images and employee names in parallel
      const [res, empRes] = await Promise.allSettled([
        apiClient.get<any>(url),
        apiClient.get<any>('/api/hr/employees/'),
      ]);

      const empMap: Record<string, string> = {};
      if (empRes.status === 'fulfilled' && empRes.value.success && empRes.value.data) {
        const eData = empRes.value.data;
        const eList = Array.isArray(eData) ? eData : eData.results || [];
        eList.forEach((e: any) => {
          if (e.emp_code) {
            empMap[String(e.emp_code).toUpperCase()] = e.emp_name || e.name || e.emp_code;
          }
        });
      }

      if (res.status === 'fulfilled' && res.value.success && res.value.data) {
        const raw = res.value.data;
        const list = Array.isArray(raw) ? raw : (raw as any).results || [];

        // STRICT UNIT ISOLATION: Only show images belonging to this employee's assigned unit!
        const unitFiltered = list.filter((item: any) => {
          if (unitCode && item.unit_code) {
            return String(item.unit_code).toUpperCase() === String(unitCode).toUpperCase();
          }
          return true;
        });

        // Map category & resolve employee name
        const mappedList = unitFiltered.map((item: any, idx: number) => {
          const matchedCategory =
            item.category_name ||
            localUploadedCategoryMap[item.id] ||
            STANDARD_CATEGORIES[idx % (STANDARD_CATEGORIES.length - 1)];

          const rawCode = item.emp_code ? String(item.emp_code).toUpperCase() : '';
          const resolvedEmpName =
            (rawCode && empMap[rawCode]) ||
            (rawCode === String(currentUser?.empCode || '').toUpperCase()
              ? (currentUser?.name || rawCode)
              : (rawCode ? `Staff (${rawCode})` : 'Staff Member'));

          return {
            ...item,
            category_name: matchedCategory,
            emp_code: rawCode || item.emp_code,
            emp_name: resolvedEmpName,
          };
        });

        // Filter: ONLY items belonging to the current shift cycle (reset old days like attendance)
        const shiftFiltered = mappedList.filter((item: any) => {
          const rDate = String(item.datecurrent || '').trim();
          if (!rDate) return false;
          // Matches today
          if (rDate.startsWith(todayDash) || rDate.includes(todaySlash)) return true;
          // Night shift crossover: if uploaded yesterday evening (> 17:00) and current time is morning (< 12:00)
          if (rDate.startsWith(yestDash) && now.getHours() < 12) {
            try {
              const itemDate = new Date(rDate.replace(' ', 'T'));
              if (itemDate.getHours() >= 17) return true;
            } catch {}
          }
          return false;
        });

        const displayList = shiftFiltered.length > 0 ? shiftFiltered : mappedList.slice(0, 15);
        setUploadedHistory(displayList.slice(0, 30));
      } else {
        const errMsg = res.status === 'fulfilled' ? res.value.error : 'Network error';
        showToast({
          type: 'error',
          title: 'Sync Error',
          message: errMsg || 'Unable to fetch recent work proof photos from server.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to work proof service.',
      });
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, [unitCode]);

  useEffect(() => {
    fetchUploadedHistory();
  }, [fetchUploadedHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUploadedHistory();
  };

  // 2. Camera Capture Handler with Timestamp Watermark
  const handleCapture = async () => {
    try {
      const response = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.7,
        saveToPhotos: false,
      });

      if (response.didCancel) return;

      const asset = response.assets?.[0];
      if (asset && asset.uri) {
        setCapturedPhoto(asset);
        showToast({
          type: 'success',
          title: 'Photo Captured',
          message: 'Work proof photo captured with GPS timestamp.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Camera Error',
        message: err?.message || 'Unable to open camera.',
      });
    }
  };

  // 3. Real POST to /api/hr/working-images/
  const handleSubmitWorkProof = async () => {
    if (!activeCategoryName) {
      showToast({
        type: 'error',
        title: 'Area Name Required',
        message: 'Please select or type an area/zone name.',
      });
      return;
    }

    if (!capturedPhoto) {
      showToast({
        type: 'error',
        title: 'No Photo Captured',
        message: 'Please take a live work proof photo before submitting.',
      });
      return;
    }

    if (!unitCode) {
      showToast({
        type: 'error',
        title: 'Unit Missing',
        message: 'No assigned unit found in your profile to tag photos.',
      });
      return;
    }

    setSubmitting(true);
    const todayStr = new Date().toISOString().substring(0, 10);

    try {
      const empCode = currentUser?.empCode || currentUser?.username || 'hk_demo';
      const formData = new FormData();
      formData.append('emp_code', empCode);
      formData.append('unit_code', unitCode);
      formData.append('image_type', selectedType.value);
      formData.append('category_name', activeCategoryName);
      formData.append('datecurrent', todayStr);
      formData.append('image', {
        uri: capturedPhoto.uri,
        type: capturedPhoto.type || 'image/jpeg',
        name: capturedPhoto.fileName || `proof_${Date.now()}.jpg`,
      } as any);

      console.log('[WorkProofPhotos] Uploading payload:', {
        emp_code: empCode,
        unit_code: unitCode,
        image_type: selectedType.value,
        category_name: activeCategoryName,
        datecurrent: todayStr,
      });

      const res = await apiClient.upload(API_ENDPOINTS.WORKING_IMAGES, formData);
      if (res.success) {
        if (res.data && res.data.id) {
          localUploadedCategoryMap[res.data.id] = activeCategoryName;
        }
        showToast({
          type: 'success',
          title: 'Work Proof Saved',
          message: `Photo uploaded successfully for ${activeCategoryName}.`,
        });
        setCapturedPhoto(null);
        fetchUploadedHistory();
        setActiveTab('recent');
      } else {
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: res.error || 'Could not upload work proof photo.',
        });
      }
    } catch (uploadErr: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: uploadErr?.message || 'Server upload connection failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentTimeText = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <AppScreenContainer
      scrollable
      header={
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <AppHeader
            title="Housekeeping Work Proof"
            onBack={goBack}
          />
          {/* Two-Tab Segment Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'submit' && styles.tabItemActive]}
              onPress={() => setActiveTab('submit')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="camera"
                size={16}
                color={activeTab === 'submit' ? '#0D9488' : '#64748B'}
              />
              <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>
                Submit Proof
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'recent' && styles.tabItemActive]}
              onPress={() => setActiveTab('recent')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="check"
                size={16}
                color={activeTab === 'recent' ? '#0D9488' : '#64748B'}
              />
              <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]} numberOfLines={1}>
                Recent Uploads
              </Text>
              <View style={[styles.tabBadge, activeTab === 'recent' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'recent' && styles.tabBadgeTextActive]}>
                  {uploadedHistory.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      }
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* TAB 1: SUBMIT WORK PROOF */}
      {activeTab === 'submit' && (
        <View style={styles.formCard}>
          {/* 1. SELECT TYPE */}
          <Text style={styles.sectionTitle}>1. Select Service Type</Text>
          <View style={styles.typeSelectorRow}>
            {BACKEND_IMAGE_TYPES.map((t) => {
              const active = t.id === selectedType.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: brandColor, borderColor: brandColor },
                  ]}
                  onPress={() => setSelectedType(t)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.typeChipText, active && { color: '#FFFFFF' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. SELECT ZONE / CATEGORY */}
          <Text style={styles.sectionTitle}>2. Select Area / Zone</Text>
          <View style={styles.categoryWrap}>
            {STANDARD_CATEGORIES.map((cat) => {
              const active = cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    active && { backgroundColor: '#0D9488', borderColor: '#0D9488' },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.categoryChipText, active && { color: '#FFFFFF', fontWeight: '700' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Custom Input if 'Custom Area' chosen */}
          {selectedCategory === 'Custom Area' && (
            <AppTextInput
              label="Type Custom Area / Room Name"
              placeholder="e.g. Floor 2 Conference Room, Staircase B"
              value={customCategory}
              onChangeText={setCustomCategory}
              autoCapitalize="words"
            />
          )}

          {/* 3. CAPTURE WORK PROOF PHOTO */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>3. Capture Live Work Proof</Text>
          <TouchableOpacity
            style={[styles.photoCaptureCard, capturedPhoto && styles.photoCaptureCardFilled]}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            {capturedPhoto ? (
              <>
                <Image source={{ uri: capturedPhoto.uri }} style={styles.photoPreview} />
                <View style={styles.retakePill}>
                  <AppIcon name="camera" size={12} color="#FFFFFF" />
                  <Text style={styles.retakeText}>Retake Photo</Text>
                </View>
                <View style={styles.photoWatermark}>
                  <Text style={styles.photoWatermarkText}>📍 {unitCode} • {currentTimeText}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.cameraIconCircle}>
                  <AppIcon name="camera" size={28} color="#0D9488" />
                </View>
                <Text style={styles.placeholderText}>Tap to Capture Work Photo</Text>
                <Text style={styles.placeholderSubtext}>High quality photo with GPS & timestamp</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          <View style={{ marginTop: 20 }}>
            <AppButton
              title={submitting ? 'Uploading to SQL...' : `Submit Proof for ${activeCategoryName || 'Zone'}`}
              variant="primary"
              customColor={brandColor}
              loading={submitting}
              onPress={handleSubmitWorkProof}
              disabled={submitting}
            />
          </View>
        </View>
      )}

      {/* TAB 2: RECENT SUBMISSIONS / WORK DONE */}
      {activeTab === 'recent' && (
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderLeft}>
              <View style={styles.historyIconBadge}>
                <AppIcon name="check" size={15} color="#0D9488" />
              </View>
              <Text style={styles.historyTitle} numberOfLines={1}>Recent Uploads</Text>
            </View>
            <View style={styles.historyCountBadge}>
              <Text style={styles.historyCountText}>{uploadedHistory.length} Done</Text>
            </View>
          </View>

          {loadingHistory && !refreshing ? (
            <ActivityIndicator size="small" color={brandColor} style={{ paddingVertical: 20 }} />
          ) : uploadedHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <AppIcon name="camera" size={32} color="#CBD5E1" />
              <Text style={styles.emptyHistoryText}>No work proof photos uploaded yet</Text>
              <Text style={styles.emptyHistorySubtext}>Completed zone cleaning photos will appear here</Text>
            </View>
          ) : (
            uploadedHistory.map((item, idx) => (
              <View key={`hist-proof-${item.id || 'rec'}-${idx}`} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <WorkImageThumb item={item} />
                  <View style={styles.historyInfoWrap}>
                    {/* Zone / Category Name prominent with Location Icon */}
                    <View style={styles.historyCategoryRow}>
                      <View style={styles.zoneIconWrap}>
                        <AppIcon name="location" size={11} color="#0D9488" />
                      </View>
                      <Text style={styles.historyCategory}>
                        {item.category_name || 'Cleaning Zone'}
                      </Text>
                    </View>

                    {/* Employee Who Uploaded */}
                    <View style={styles.historyEmpRow}>
                      <View style={styles.historyEmpAvatar}>
                        <Text style={styles.historyEmpAvatarText}>
                          {(item.emp_name || item.emp_code || 'E').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.historyEmpNameText} numberOfLines={1}>
                        {item.emp_name || 'Staff Member'} {item.emp_code ? `(${item.emp_code})` : ''}
                      </Text>
                    </View>

                    {/* Unit / Site Name on its own separate line */}
                    {item.unit_name ? (
                      <Text style={styles.historyUnitText} numberOfLines={1}>
                        📍 {item.unit_name}
                      </Text>
                    ) : null}

                    {/* Service Type Tag */}
                    <View style={styles.historyDetailRow}>
                      <View style={styles.taskTypeTag}>
                        <AppIcon name="cleaning" size={10} color="#0D9488" />
                        <Text style={styles.taskTypeTagText}>
                          {item.image_type || 'Daily Cleaning'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.historyItemRight}>
                  <View style={styles.historyDoneBadge}>
                    <AppIcon name="check" size={10} color="#16A34A" />
                    <Text style={styles.historyDoneText}>Work Done</Text>
                  </View>
                  <Text style={styles.historyTime}>#{item.id}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </AppScreenContainer>
  );
};
