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

// In-memory instant cache for today's company attendance records
export const companyAttendanceReviewCache: {
  dateFormatted: string;
  records: AttendancePunchRecord[];
  timestamp: number;
} = {
  dateFormatted: '',
  records: [],
  timestamp: 0,
};

interface AttendancePunchRecord {
  emp_code: string;
  EMP_NAME: string;
  client_name?: string;
  unit_name?: string;
  unit_code?: string;
  state_name?: string;
  address?: string;
  distances?: string;
  Date_Time?: string;
  camera_intime?: string;
  camera_outtime?: string;
  attendances_intime?: string;
  attendances_outtime?: string;
  Camera_intime_images?: string;
  Camera_outtime_images?: string;
  Attendances_intime_images?: string;
  Attendances_outtime_images?: string;
}

const formatPunchTime = (raw?: string): { formatted: string; isPending: boolean } => {
  if (
    !raw ||
    raw.trim() === '' ||
    raw.includes('Not Logged') ||
    raw.includes('Not Punched') ||
    raw.toLowerCase().includes('pending')
  ) {
    return { formatted: 'Pending', isPending: true };
  }
  const s = raw.trim();
  // Check if it has time like "18/11/2026 08:09:39 AM"
  const match12 = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])/);
  if (match12) {
    const hh = match12[1].padStart(2, '0');
    const mm = match12[2];
    const ampm = match12[3].toUpperCase();
    return { formatted: `${hh}:${mm} ${ampm}`, isPending: false };
  }
  // Try 24-hr format "HH:mm:ss" or ISO
  const match24 = s.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::\d{2})?(?:$|\s|Z)/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = match24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { formatted: `${String(h).padStart(2, '0')}:${m} ${ampm}`, isPending: false };
  }
  return { formatted: s, isPending: false };
};

export const CompanyAttendanceReviewScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());

  const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const hasCachedToday =
    companyAttendanceReviewCache.dateFormatted === todayFormatted &&
    companyAttendanceReviewCache.records.length > 0;

  const [loading, setLoading] = useState<boolean>(!hasCachedToday);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [records, setRecords] = useState<AttendancePunchRecord[]>(
    hasCachedToday ? companyAttendanceReviewCache.records : []
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live client-side employee filter by name, code or branch
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = String(r.EMP_NAME || '').toLowerCase();
      const code = String(r.emp_code || '').toLowerCase();
      const unit = String(r.unit_name || r.unit_code || '').toLowerCase();
      const addr = String(r.address || '').toLowerCase();
      return name.includes(q) || code.includes(q) || unit.includes(q) || addr.includes(q);
    });
  }, [records, searchQuery]);

  // Zoom Modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    empName: string;
    time: string;
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

  // Fetch Attendance for the selected date
  const fetchDayAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const dStr = String(selectedDay).padStart(2, '0');
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      const yStr = String(selectedYear);
      const dateFormatted = `${dStr}/${mStr}/${yStr}`;

      const base = apiConfig.getBaseUrl().replace(/\/+$/, '');
      const url = `/api/attendance/android-logs-portal/attendance-logs/?from_date=${dateFormatted}&to_date=${dateFormatted}&state_name=ALL&unit_code=ALL&client_code=ALL`;

      console.log('[CompanyAttendanceReview] Fetching logs for date:', dateFormatted, url);
      const res = await apiClient.get<any>(url);

      if (res.success && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setRecords(list);
        if (dateFormatted === todayFormatted) {
          companyAttendanceReviewCache.dateFormatted = todayFormatted;
          companyAttendanceReviewCache.records = list;
          companyAttendanceReviewCache.timestamp = Date.now();
        }
      } else {
        // Fallback: If portal logs returns empty or 403, try generic android-logs
        const altUrl = `/api/attendance/android-logs/?date_time__date=${yStr}-${mStr}-${dStr}`;
        const altRes = await apiClient.get<any>(altUrl);
        if (altRes.success && altRes.data) {
          const altList = Array.isArray(altRes.data) ? altRes.data : altRes.data.results || [];
          setRecords(altList);
          if (dateFormatted === todayFormatted) {
            companyAttendanceReviewCache.dateFormatted = todayFormatted;
            companyAttendanceReviewCache.records = altList;
            companyAttendanceReviewCache.timestamp = Date.now();
          }
        } else {
          setRecords([]);
          if (res.error) {
            setErrorMsg(res.error);
          }
        }
      }
    } catch (err: any) {
      console.warn('[CompanyAttendanceReview] Error fetching attendance:', err);
      setErrorMsg(err?.message || 'Could not load company attendance logs.');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDayAttendance();
  }, [fetchDayAttendance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDayAttendance();
  };

  const buildImageUrl = (fileName?: string) => {
    if (!fileName || !fileName.trim()) return '';
    if (fileName.startsWith('http')) return fileName;
    const base = apiConfig.getBaseUrl().replace(/\/+$/, '');
    const clean = fileName.startsWith('/') ? fileName.substring(1) : fileName;
    if (clean.startsWith('media/')) {
      return `${base}/${clean}`;
    }
    return `${base}/media/attendance_images/${clean}`;
  };

  const selectedDateLabel = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, selectedDay);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth, selectedDay]);

  const isTodaySelected =
    now.getFullYear() === selectedYear &&
    now.getMonth() === selectedMonth &&
    now.getDate() === selectedDay;

  return (
    <AppScreenContainer
      scrollable
      header={
        <View style={uiStyles.headerWrapper}>
          <AppHeader
            title="Company Attendance Review"
            subtitle={`${currentCompany?.name || 'All Branches'} • Punch In & Out Photos`}
            onBack={goBack}
          />
        </View>
      }
      contentContainerStyle={uiStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. Month Navigation Header Card */}
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
            <Text style={uiStyles.monthSubText}>Tap any date below to inspect punches</Text>
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
            <View key={idx} style={uiStyles.weekDayCol}>
              <Text style={[uiStyles.weekDayText, idx === 0 && { color: '#EF4444' }]}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={uiStyles.calendarGrid}>
          {/* Blank offset cells for starting day */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <View key={`empty-${idx}`} style={uiStyles.dayCol} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isSelected = selectedDay === dayNum;
            const isToday =
              now.getFullYear() === selectedYear &&
              now.getMonth() === selectedMonth &&
              now.getDate() === dayNum;

            return (
              <View key={`day-${dayNum}`} style={uiStyles.dayCol}>
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
                  {isToday && !isSelected && <View style={[uiStyles.todayDot, { backgroundColor: brandColor }]} />}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </AppCard>

      {/* 2. Selected Date Punch Summary Banner */}
      <View style={uiStyles.summaryBanner}>
        <View style={uiStyles.summaryBannerLeft}>
          <View style={uiStyles.calendarIconWrap}>
            <AppIcon name="calendar" size={16} color="#0D9488" />
          </View>
          <View>
            <Text style={uiStyles.summaryDateTitle}>{selectedDateLabel}</Text>
            <Text style={uiStyles.summarySubText}>
              {loading ? 'Fetching punches...' : `${records.length} Employees Logged Attendance`}
            </Text>
          </View>
        </View>

        <View style={[uiStyles.countBadge, { backgroundColor: records.length > 0 ? '#DCFCE7' : '#F1F5F9' }]}>
          <Text
            style={[
              uiStyles.countBadgeText,
              { color: records.length > 0 ? '#16A34A' : '#64748B' },
            ]}
          >
            {records.length} Present
          </Text>
        </View>
      </View>

      {/* 2b. Employee Search Bar */}
      {records.length > 0 && (
        <>
          <View style={uiStyles.searchContainer}>
            <View style={uiStyles.searchIconWrap}>
              <AppIcon name="search" size={16} color="#64748B" />
            </View>
            <TextInput
              style={uiStyles.searchInput}
              placeholder="Search employee by name, code (H00001) or unit..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                style={uiStyles.searchClearBtn}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <Text style={uiStyles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.trim().length > 0 && (
            <Text style={uiStyles.searchCountText}>
              Showing {filteredRecords.length} of {records.length} staff
            </Text>
          )}
        </>
      )}

      {/* 3. Employee Attendance & Real Photos List */}
      {loading && !refreshing ? (
        <View style={uiStyles.loadingBox}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={uiStyles.loadingText}>Fetching punch in/out photos from cloud database...</Text>
        </View>
      ) : records.length === 0 ? (
        <AppCard style={uiStyles.emptyCard}>
          <AppIcon name="camera" size={38} color="#CBD5E1" />
          <Text style={uiStyles.emptyTitle}>No Punches on this Date</Text>
          <Text style={uiStyles.emptySubtext}>
            No employee punch logs or selfie proofs were recorded for {selectedDateLabel}.
          </Text>
          {errorMsg ? <Text style={uiStyles.errorHintText}>Note: {errorMsg}</Text> : null}
        </AppCard>
      ) : filteredRecords.length === 0 ? (
        <AppCard style={uiStyles.emptyCard}>
          <AppIcon name="search" size={36} color="#CBD5E1" />
          <Text style={uiStyles.emptyTitle}>No Matching Employee</Text>
          <Text style={uiStyles.emptySubtext}>
            No punch record found matching "{searchQuery}" on {selectedDateLabel}.
          </Text>
          <TouchableOpacity
            style={uiStyles.clearFilterBtn}
            onPress={() => setSearchQuery('')}
            activeOpacity={0.8}
          >
            <Text style={uiStyles.clearFilterBtnText}>Clear Search Filter</Text>
          </TouchableOpacity>
        </AppCard>
      ) : (
        filteredRecords.map((item, index) => {
          const inPhotoName = item.Camera_intime_images || item.Attendances_intime_images;
          const outPhotoName = item.Camera_outtime_images || item.Attendances_outtime_images;
          const inPhotoUrl = buildImageUrl(inPhotoName);
          const outPhotoUrl = buildImageUrl(outPhotoName);

          const inTimeRaw = item.camera_intime || item.attendances_intime || item.Date_Time || '';
          const outTimeRaw = item.camera_outtime || item.attendances_outtime || '';
          const inTimeObj = formatPunchTime(inTimeRaw);
          const outTimeObj = formatPunchTime(outTimeRaw);

          return (
            <AppCard
              key={`att-card-${item.emp_code || 'emp'}-${item.Date_Time || ''}-${index}`}
              style={uiStyles.recordCard}
            >
              {/* Employee Top Bar */}
              <View style={uiStyles.recordHeader}>
                <View style={uiStyles.empAvatarCircle}>
                  <Text style={uiStyles.empAvatarText}>
                    {(item.EMP_NAME || 'E').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={uiStyles.empDetailsWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={uiStyles.empNameText}>{item.EMP_NAME || 'Staff Member'}</Text>
                    {String(item.address || '').toUpperCase().startsWith('[WFH]') && (
                      <View style={{ backgroundColor: '#EFF6FF', borderColor: '#93C5FD', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>🏠 WFH</Text>
                      </View>
                    )}
                    {String(item.address || '').toUpperCase().startsWith('[OFFSITE]') && (
                      <View style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>🚗 OFFSITE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={uiStyles.empCodeBadge}>
                    Code: {item.emp_code} • Unit: {item.unit_name || item.unit_code || 'Site'}
                  </Text>
                  {item.address ? (
                    <Text style={uiStyles.addressText} numberOfLines={1}>
                      📍 {item.address} {item.distances ? `(${item.distances}m away)` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Timing Grid with Auto-fit */}
              <View style={uiStyles.timingRow}>
                <View style={uiStyles.timingBox}>
                  <View style={uiStyles.timingHeaderRow}>
                    <View style={[uiStyles.dot, { backgroundColor: '#16A34A' }]} />
                    <Text style={uiStyles.timingLabel}>PUNCH IN</Text>
                  </View>
                  <Text
                    style={[uiStyles.timingValue, { color: '#16A34A' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {inTimeObj.formatted}
                  </Text>
                </View>

                <View style={uiStyles.timingDivider} />

                <View style={uiStyles.timingBox}>
                  <View style={uiStyles.timingHeaderRow}>
                    <View style={[uiStyles.dot, { backgroundColor: outTimeObj.isPending ? '#94A3B8' : '#2563EB' }]} />
                    <Text style={uiStyles.timingLabel}>PUNCH OUT</Text>
                  </View>
                  <Text
                    style={[
                      uiStyles.timingValue,
                      { color: outTimeObj.isPending ? '#94A3B8' : '#2563EB' },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {outTimeObj.isPending ? 'Pending Out' : outTimeObj.formatted}
                  </Text>
                </View>
              </View>

              {/* Side-by-Side Punch In & Punch Out Selfie Photos */}
              <Text style={uiStyles.photosSectionTitle}>Selfie Verification Proofs</Text>
              <View style={uiStyles.photosRow}>
                {/* 1. Punch In Selfie */}
                <View style={uiStyles.photoCol}>
                  <Text style={uiStyles.photoLabel}>📷 Punch In Photo</Text>
                  {inPhotoUrl ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        setPreviewImage({
                          url: inPhotoUrl,
                          title: 'Punch In Verification Photo',
                          empName: item.EMP_NAME,
                          time: inTimeObj.formatted,
                        })
                      }
                      style={uiStyles.photoWrap}
                    >
                      <Image source={{ uri: inPhotoUrl }} style={uiStyles.photoImg} />
                      <View style={uiStyles.zoomBadge}>
                        <AppIcon name="search" size={11} color="#FFFFFF" />
                        <Text style={uiStyles.zoomText}>View</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={uiStyles.noPhotoPlaceholder}>
                      <AppIcon name="camera" size={20} color="#94A3B8" />
                      <Text style={uiStyles.noPhotoText}>No In Photo</Text>
                    </View>
                  )}
                </View>

                {/* 2. Punch Out Selfie */}
                <View style={uiStyles.photoCol}>
                  <Text style={uiStyles.photoLabel}>📷 Punch Out Photo</Text>
                  {outPhotoUrl ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        setPreviewImage({
                          url: outPhotoUrl,
                          title: 'Punch Out Verification Photo',
                          empName: item.EMP_NAME,
                          time: outTimeObj.formatted,
                        })
                      }
                      style={uiStyles.photoWrap}
                    >
                      <Image source={{ uri: outPhotoUrl }} style={uiStyles.photoImg} />
                      <View style={uiStyles.zoomBadge}>
                        <AppIcon name="search" size={11} color="#FFFFFF" />
                        <Text style={uiStyles.zoomText}>View</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={uiStyles.noPhotoPlaceholder}>
                      <AppIcon name="camera" size={20} color="#94A3B8" />
                      <Text style={uiStyles.noPhotoText}>
                        {outTimeObj.isPending ? 'Pending Out' : 'No Out Photo'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </AppCard>
          );
        })
      )}

      {/* 4. Fullscreen Zoom Modal */}
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
              <View>
                <Text style={uiStyles.modalTitle}>{previewImage?.title}</Text>
                <Text style={uiStyles.modalSubtitle}>
                  {previewImage?.empName} • {previewImage?.time}
                </Text>
              </View>
              <TouchableOpacity
                style={uiStyles.closeBtn}
                onPress={() => setPreviewImage(null)}
                activeOpacity={0.7}
              >
                <Text style={uiStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Large Image Preview */}
            {previewImage?.url ? (
              <Image
                source={{ uri: previewImage.url }}
                style={uiStyles.largePreviewImg}
                resizeMode="contain"
              />
            ) : null}

            {/* Modal Footer */}
            <View style={uiStyles.modalFooter}>
              <AppButton
                title="Close Photo"
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
    borderBottomColor: '#E2E8F0',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  navCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
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
    backgroundColor: '#CCFBF1',
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
  searchClearBtn: {
    padding: 6,
  },
  searchClearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  searchCountText: {
    fontSize: 11,
    color: '#0D9488',
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
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
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
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  errorHintText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 10,
    textAlign: 'center',
  },
  recordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
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
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  empDetailsWrap: {
    flex: 1,
  },
  empNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  empCodeBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  timingRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  timingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timingDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
  },
  timingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  timingValue: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  photosSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoCol: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  photoWrap: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noPhotoPlaceholder: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  largePreviewImg: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});
