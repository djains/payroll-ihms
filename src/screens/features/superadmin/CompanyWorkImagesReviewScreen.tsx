import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  AppScreenContainer,
  AppHeader,
  AppCard,
  AppIcon,
  AppButton,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import { apiConfig } from '../../../api/config';
import { colors } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface WorkImageRecord {
  id?: number | string;
  emp_code?: string;
  EMP_NAME: string;
  unit_name?: string;
  unit_code?: string;
  state_name?: string;
  category_name?: string;
  image_type?: string;
  image_name: string;
  image_url?: string;
  datecurrent?: string;
}

const formatWorkTime = (raw?: string): { time: string; fullDate: string } => {
  if (!raw || !raw.trim()) return { time: 'Logged', fullDate: '' };
  const s = raw.trim();
  // Check 12-hr format e.g. "18/11/2026 03:20:58 PM"
  const match12 = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])/);
  if (match12) {
    const hh = match12[1].padStart(2, '0');
    const mm = match12[2];
    const ampm = match12[3].toUpperCase();
    return { time: `${hh}:${mm} ${ampm}`, fullDate: s };
  }
  // Check 24-hr format
  const match24 = s.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::\d{2})?(?:$|\s|Z)/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = match24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { time: `${String(h).padStart(2, '0')}:${m} ${ampm}`, fullDate: s };
  }
  return { time: s, fullDate: s };
};

const resolveCategory = (cat?: string, imgName?: string): { label: string; icon: string; color: string; bg: string } => {
  const combined = `${cat || ''} ${imgName || ''}`.toLowerCase();
  if (combined.includes('deep') || combined.includes('deep_cleaning')) {
    return { label: 'Deep Cleaning', icon: 'sparkles', color: '#0284C7', bg: '#E0F2FE' };
  }
  if (combined.includes('cleaning') || combined.includes('clean')) {
    return { label: 'Cleaning Work', icon: 'brush', color: '#0D9488', bg: '#CCFBF1' };
  }
  if (combined.includes('pest')) {
    return { label: 'Pest Control', icon: 'shield', color: '#D97706', bg: '#FEF3C7' };
  }
  if (combined.includes('security') || combined.includes('patrol') || combined.includes('guard')) {
    return { label: 'Security Patrol', icon: 'eye', color: '#4F46E5', bg: '#EEF2FF' };
  }
  if (combined.includes('waste') || combined.includes('garbage')) {
    return { label: 'Waste Management', icon: 'trash', color: '#DC2626', bg: '#FEE2E2' };
  }
  return { label: cat?.trim() || 'Daily Work Proof', icon: 'camera', color: '#7C3AED', bg: '#EDE9FE' };
};

const CATEGORY_FILTERS = ['ALL', 'Cleaning', 'Deep Cleaning', 'Pest Control', 'Security', 'Waste'];

export const CompanyWorkImagesReviewScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [records, setRecords] = useState<WorkImageRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Preview Modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    empName: string;
    time: string;
    unit: string;
  } | null>(null);

  // Month navigation
  const monthDate = useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedYear, selectedMonth]);
  const monthName = useMemo(() => monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [monthDate]);
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth + 1, 0).getDate(), [selectedYear, selectedMonth]);
  const firstDayOfWeek = useMemo(() => new Date(selectedYear, selectedMonth, 1).getDay(), [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const isTodaySelected =
    now.getFullYear() === selectedYear &&
    now.getMonth() === selectedMonth &&
    now.getDate() === selectedDay;

  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, selectedDay);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth, selectedDay]);

  // Build Image URL with support for attendance_images/ and working_images/
  const buildImageUrl = useCallback((fileName?: string, providedUrl?: string) => {
    if (providedUrl && providedUrl.trim()) {
      return providedUrl;
    }
    if (!fileName || !fileName.trim()) return '';
    const base = apiConfig.getBaseUrl().replace(/\/+$/, '');
    const clean = fileName.startsWith('/') ? fileName.substring(1) : fileName;
    if (clean.startsWith('media/')) {
      return `${base}/${clean}`;
    }
    // Mobile uploaded work images go to attendance_images
    if (clean.includes('Working_') || clean.includes('_Working_')) {
      return `${base}/media/attendance_images/${clean}`;
    }
    return `${base}/media/working_images/${clean}`;
  }, []);

  // Fetch Work Images for selected date
  const fetchWorkImages = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const dStr = String(selectedDay).padStart(2, '0');
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      const yStr = selectedYear;
      const dateFormatted = `${dStr}/${mStr}/${yStr}`;

      const fetchedList: WorkImageRecord[] = [];

      // Fetch employee master map to resolve real employee names
      const empMap: Record<string, string> = {};
      try {
        const empRes = await apiClient.get<any>('/api/hr/employees/');
        if (empRes.success && empRes.data) {
          const eList = Array.isArray(empRes.data) ? empRes.data : empRes.data.results || [];
          eList.forEach((e: any) => {
            if (e.emp_code) {
              empMap[String(e.emp_code).toUpperCase()] = e.emp_name || e.name || e.emp_code;
            }
          });
        }
      } catch {}

      // 1. Fetch from android-logs-portal work-images
      try {
        const portalUrl = `/api/attendance/android-logs-portal/work-images/?from_date=${dateFormatted}&to_date=${dateFormatted}&state_name=ALL&unit_code=ALL&client_code=ALL`;
        const res = await apiClient.get<any>(portalUrl);
        if (res.success && res.data) {
          const rows = Array.isArray(res.data) ? res.data : res.data.results || [];
          rows.forEach((r: any, rIdx: number) => {
            const rawImg = r.image_name || '';
            if (rawImg) {
              const parsedCode = rawImg.includes('_') ? rawImg.split('_')[0] : '';
              const resolvedEmpCode =
                r.emp_code ||
                r.EMP_CODE ||
                r.empCode ||
                (parsedCode && !parsedCode.includes('/') ? parsedCode : 'Staff');
              const resolvedEmpName =
                r.EMP_NAME ||
                r.emp_name ||
                r.name ||
                empMap[resolvedEmpCode.toUpperCase()] ||
                'Staff Member';
              const resolvedId = r.id
                ? `portal-${r.id}-${rIdx}`
                : `portal-${resolvedEmpCode}-${rawImg}-${rIdx}`;

              fetchedList.push({
                id: resolvedId,
                emp_code: resolvedEmpCode,
                EMP_NAME: resolvedEmpName,
                unit_name: r.unit_name || r.unit_code || 'Site Unit',
                state_name: r.state_name || '',
                category_name: r.category_name || r.image_type || '',
                image_name: rawImg,
                datecurrent: r.datecurrent,
              });
            }
          });
        }
      } catch (pErr) {
        // non-blocking
      }

      // 2. Fallback / Merge with /api/hr/working-images/
      try {
        const dateIso = `${yStr}-${mStr}-${dStr}`;
        const workingRes = await apiClient.get<any>(`/api/hr/working-images/`);
        if (workingRes.success && workingRes.data) {
          const wRows = Array.isArray(workingRes.data) ? workingRes.data : workingRes.data.results || [];
          wRows.forEach((wr: any, wIdx: number) => {
            const dtRaw = wr.datecurrent || '';
            if (dtRaw.includes(dateFormatted) || dtRaw.includes(dateIso)) {
              if (!fetchedList.some((f) => f.image_name === wr.image_name)) {
                const parsedCode =
                  wr.image_name && wr.image_name.includes('_') ? wr.image_name.split('_')[0] : '';
                const resolvedEmpCode =
                  wr.emp_code ||
                  wr.EMP_CODE ||
                  (parsedCode && !parsedCode.includes('/') ? parsedCode : 'Staff');
                const resolvedId = wr.id
                  ? `hr-${wr.id}-${wIdx}`
                  : `hr-${resolvedEmpCode}-${wr.image_name || ''}-${wIdx}`;

                const resolvedEmpName =
                  wr.emp_name ||
                  wr.EMP_NAME ||
                  empMap[resolvedEmpCode.toUpperCase()] ||
                  'Staff Member';

                fetchedList.push({
                  id: resolvedId,
                  emp_code: resolvedEmpCode,
                  EMP_NAME: resolvedEmpName,
                  unit_name: wr.unit_name || wr.unit_code || 'Site Unit',
                  category_name: wr.category_name || wr.image_type || '',
                  image_name: wr.image_name,
                  image_url: wr.image_url,
                  datecurrent: wr.datecurrent,
                });
              }
            }
          });
        }
      } catch (wErr) {
        // non-blocking
      }

      setRecords(fetchedList);
    } catch (err: any) {
      console.warn('[CompanyWorkImagesReview] Error fetching work photos:', err);
      setErrorMsg(err?.message || 'Could not load work image logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchWorkImages();
  }, [fetchWorkImages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkImages();
  };

  // Filtered by Search & Category
  const filteredRecords = useMemo(() => {
    let result = records;

    if (selectedCategoryFilter !== 'ALL') {
      result = result.filter((r) => {
        const cat = resolveCategory(r.category_name, r.image_name).label.toLowerCase();
        return cat.includes(selectedCategoryFilter.toLowerCase());
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const name = String(r.EMP_NAME || '').toLowerCase();
        const code = String(r.emp_code || '').toLowerCase();
        const unit = String(r.unit_name || r.unit_code || '').toLowerCase();
        return name.includes(q) || code.includes(q) || unit.includes(q);
      });
    }

    return result;
  }, [records, searchQuery, selectedCategoryFilter]);

  return (
    <AppScreenContainer
      scrollable
      header={
        <View style={uiStyles.headerWrapper}>
          <AppHeader
            title="Work Photos Review"
            subtitle={`${currentCompany?.name || 'All Branches'} • Daily Work Proofs`}
            onBack={goBack}
          />
        </View>
      }
      contentContainerStyle={uiStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandColor]} />
      }
    >
      {/* ── 1. MONTH NAVIGATION CALENDAR CARD ── */}
      <AppCard style={uiStyles.navCard}>
        <View style={uiStyles.navRow}>
          <TouchableOpacity
            style={uiStyles.navArrowBtn}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
          >
            <Text style={uiStyles.navArrowText}>‹</Text>
          </TouchableOpacity>

          <View style={uiStyles.monthTitleContainer}>
            <Text style={uiStyles.monthTitleText}>{monthName}</Text>
            <Text style={uiStyles.monthSubText}>Tap any date below to inspect work photos</Text>
          </View>

          <TouchableOpacity
            style={uiStyles.navArrowBtn}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <Text style={uiStyles.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Today Jump Button */}
        {!isTodaySelected && (
          <TouchableOpacity
            style={[uiStyles.todayBtn, { borderColor: brandColor }]}
            onPress={handleJumpToToday}
            activeOpacity={0.8}
          >
            <AppIcon name="calendar" size={13} color={brandColor} />
            <Text style={[uiStyles.todayBtnText, { color: brandColor }]}>Jump to Today</Text>
          </TouchableOpacity>
        )}

        {/* Calendar Day of Week Header */}
        <View style={uiStyles.weekDaysRow}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
            <View key={`weekday-${w}-${idx}`} style={uiStyles.weekDayCol}>
              <Text style={[uiStyles.weekDayText, idx === 0 && { color: '#EF4444' }]}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={uiStyles.calendarGrid}>
          {/* Blank offset cells for starting day */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <View key={`cal-empty-${idx}`} style={uiStyles.dayCol} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isSelected = selectedDay === dayNum;
            const isToday =
              now.getFullYear() === selectedYear &&
              now.getMonth() === selectedMonth &&
              now.getDate() === dayNum;

            return (
              <View key={`cal-day-${dayNum}-${idx}`} style={uiStyles.dayCol}>
                <TouchableOpacity
                  style={[
                    uiStyles.dayBox,
                    isToday && uiStyles.dayBoxToday,
                    isSelected && { backgroundColor: brandColor, borderColor: brandColor },
                  ]}
                  onPress={() => setSelectedDay(dayNum)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      uiStyles.dayNumText,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      isToday && !isSelected && { color: brandColor, fontWeight: '700' },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {isToday && !isSelected && (
                    <View style={[uiStyles.todayDot, { backgroundColor: brandColor }]} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </AppCard>

      {/* ── 2. SELECTED DATE SUMMARY BANNER ── */}
      <View style={uiStyles.summaryBanner}>
        <View style={uiStyles.summaryBannerLeft}>
          <View style={uiStyles.calendarIconWrap}>
            <AppIcon name="passport-photo" size={16} color="#7C3AED" />
          </View>
          <View>
            <Text style={uiStyles.summaryDateTitle}>{selectedDateLabel}</Text>
            <Text style={uiStyles.summarySubText}>
              {loading
                ? 'Fetching work photos...'
                : `${filteredRecords.length} ${filteredRecords.length === 1 ? 'Work Photo' : 'Work Photos'} Uploaded`}
            </Text>
          </View>
        </View>

        <View
          style={[
            uiStyles.countBadge,
            { backgroundColor: records.length > 0 ? '#EDE9FE' : '#F1F5F9' },
          ]}
        >
          <Text
            style={[
              uiStyles.countBadgeText,
              { color: records.length > 0 ? '#6D28D9' : '#64748B' },
            ]}
          >
            {records.length} Total
          </Text>
        </View>
      </View>

      {/* ── 2b. CATEGORY FILTERS ROW ── */}
      {records.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={uiStyles.catFilterContainer}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isSel = selectedCategoryFilter === cat;
            return (
              <TouchableOpacity
                key={`cat-${cat}`}
                onPress={() => setSelectedCategoryFilter(cat)}
                style={[
                  uiStyles.catFilterPill,
                  isSel && { backgroundColor: brandColor, borderColor: brandColor },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    uiStyles.catFilterText,
                    isSel && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {cat === 'ALL' ? 'All Proofs' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── 2c. EMPLOYEE SEARCH BAR ── */}
      {records.length > 0 && (
        <>
          <View style={uiStyles.searchContainer}>
            <View style={uiStyles.searchIconWrap}>
              <AppIcon name="search" size={16} color="#64748B" />
            </View>
            <TextInput
              style={uiStyles.searchInput}
              placeholder="Search by employee name, code, or branch..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={uiStyles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {filteredRecords.length !== records.length && (
            <Text style={uiStyles.searchCountText}>
              Showing {filteredRecords.length} of {records.length} records matching "{searchQuery}"
            </Text>
          )}
        </>
      )}

      {/* ── 3. WORK PHOTOS LIST ── */}
      {loading && !refreshing ? (
        <View style={uiStyles.loadingBox}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={uiStyles.loadingText}>Fetching work photos from MySQL...</Text>
        </View>
      ) : errorMsg ? (
        <AppCard style={uiStyles.errorCard}>
          <AppIcon name="alert" size={24} color="#EF4444" />
          <Text style={uiStyles.errorTitle}>Could Not Load Records</Text>
          <Text style={uiStyles.errorBody}>{errorMsg}</Text>
          <AppButton title="Try Again" onPress={fetchWorkImages} style={{ marginTop: 12 }} />
        </AppCard>
      ) : filteredRecords.length === 0 ? (
        <AppCard style={uiStyles.emptyCard}>
          <View style={uiStyles.emptyIconCircle}>
            <AppIcon name="camera" size={32} color="#94A3B8" />
          </View>
          <Text style={uiStyles.emptyTitle}>No Work Photos Uploaded</Text>
          <Text style={uiStyles.emptySubtitle}>
            {searchQuery
              ? `No work images matching "${searchQuery}" for this date.`
              : `No work or site images were uploaded by employees on ${selectedDateLabel}.`}
          </Text>
          {(searchQuery || selectedCategoryFilter !== 'ALL') && (
            <TouchableOpacity
              style={uiStyles.clearFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('ALL');
              }}
              activeOpacity={0.7}
            >
              <Text style={uiStyles.clearFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          )}
        </AppCard>
      ) : (
        filteredRecords.map((item, index) => {
          const rawUrl = buildImageUrl(item.image_name, item.image_url);
          const imageSource = apiClient.getImageSource(rawUrl);
          const timeObj = formatWorkTime(item.datecurrent);
          const categoryMeta = resolveCategory(item.category_name, item.image_name);

          return (
            <AppCard
              key={`work-item-${item.id || item.image_name || 'rec'}-${index}`}
              style={uiStyles.recordCard}
            >
              {/* Employee Header */}
              <View style={uiStyles.recordHeader}>
                <View style={uiStyles.empAvatarCircle}>
                  <Text style={uiStyles.empAvatarText}>
                    {(item.EMP_NAME || 'W').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={uiStyles.empDetailsWrap}>
                  <Text style={uiStyles.empNameText}>{item.EMP_NAME || 'Staff Member'}</Text>
                  <Text style={uiStyles.empCodeBadge}>
                    Code: {item.emp_code} • Branch: {item.unit_name || 'Assigned Site'}
                  </Text>
                  <View style={uiStyles.metaRow}>
                    <View style={[uiStyles.catChip, { backgroundColor: categoryMeta.bg }]}>
                      <Text style={[uiStyles.catChipText, { color: categoryMeta.color }]}>
                        {categoryMeta.label}
                      </Text>
                    </View>
                    <Text style={uiStyles.timeText}>🕒 {timeObj.time}</Text>
                  </View>
                </View>
              </View>

              {/* Work Photo Container with Tap to Zoom */}
              {imageSource ? (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() =>
                    setPreviewImage({
                      url: rawUrl,
                      title: categoryMeta.label,
                      empName: item.EMP_NAME,
                      time: timeObj.time,
                      unit: item.unit_name || 'Assigned Branch',
                    })
                  }
                  style={uiStyles.photoContainer}
                >
                  <Image source={imageSource} style={uiStyles.workImg} resizeMode="cover" />
                  <View style={uiStyles.zoomBadge}>
                    <AppIcon name="search" size={12} color="#FFFFFF" />
                    <Text style={uiStyles.zoomText}>View Full Photo</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={uiStyles.noPhotoPlaceholder}>
                  <AppIcon name="camera" size={24} color="#94A3B8" />
                  <Text style={uiStyles.noPhotoText}>No Image File Available</Text>
                </View>
              )}
            </AppCard>
          );
        })
      )}

      {/* ── 4. FULLSCREEN PHOTO ZOOM MODAL ── */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={uiStyles.modalOverlay}>
          <View style={uiStyles.modalContent}>
            {/* Modal Header */}
            <View style={uiStyles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={uiStyles.modalTitle}>{previewImage?.title || 'Work Image'}</Text>
                <Text style={uiStyles.modalSubtitle}>
                  {previewImage?.empName} • {previewImage?.unit} • {previewImage?.time}
                </Text>
              </View>
              <TouchableOpacity
                style={uiStyles.closeBtn}
                onPress={() => setPreviewImage(null)}
                activeOpacity={0.7}
              >
                <AppIcon name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Large Image Preview */}
            {previewImage?.url ? (
              <Image
                source={apiClient.getImageSource(previewImage.url)!}
                style={uiStyles.largePreviewImg}
                resizeMode="contain"
              />
            ) : null}

            {/* Modal Footer */}
            <View style={uiStyles.modalFooter}>
              <AppButton
                title="Close Preview"
                variant="outline"
                onPress={() => setPreviewImage(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreenContainer>
  );
};

const uiStyles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  navCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#334155',
    marginTop: -2,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  weekDayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCol: {
    width: '14.28%',
    padding: 3,
    alignItems: 'center',
  },
  dayBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayBoxToday: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  calendarIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summarySubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  catFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 2,
  },
  catFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catFilterText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIconWrap: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  searchClearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    padding: 4,
  },
  searchCountText: {
    fontSize: 11,
    color: '#7C3AED',
    marginBottom: 12,
    marginTop: -2,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  clearFilterBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 12,
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },
  errorBody: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  recordCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  empAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  empAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
  },
  empDetailsWrap: {
    flex: 1,
  },
  empNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  empCodeBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workImg: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noPhotoPlaceholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  largePreviewImg: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
});
