import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useAuthStore } from '../../../store/authStore';
import { useTenantStore } from '../../../store/tenantStore';
import { showToast } from '../../../store/toastStore';
import { apiClient } from '../../../api/client';
import { apiConfig, API_ENDPOINTS } from '../../../api/config';
import { superadminApi, BackendUnit } from '../../../api';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, ms } from '../../../theme';

// ─── helpers ────────────────────────────────────────────────────
// In-memory instant cache for documents
export const documentVerifyCache: {
  records: DocRecord[];
  timestamp: number;
} = {
  records: [],
  timestamp: 0,
};

type RejectVal = 0 | 1 | 2;

const STATUS_CFG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Pending',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  1: { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  2: { label: 'Approved', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
};

const DOC_LABEL: Record<string, string> = {
  police_verification_form: 'Police Verification',
  adhar_card_upload:        'Aadhaar Card',
  Pan_card_upload:          'PAN Card',
  joining_form:             'Joining Form',
  form_11:                  'Form 11',
  form_2:                   'Form 2',
  bank_passbook:            'Bank Passbook',
  passprt_size_photo:       'Passport Photo',
  Employee_photo_upload:    'Employee ID Photo',
};

const DOC_ICON: Record<string, string> = {
  police_verification_form: 'police-shield',
  adhar_card_upload:        'id-card',
  Pan_card_upload:          'pan-card',
  joining_form:             'joining-form',
  bank_passbook:            'bank-passbook',
  passprt_size_photo:       'passport-photo',
  Employee_photo_upload:    'camera',
};

interface DocRecord {
  id: number;
  emp_code: string;
  emp_name: string;
  client_name?: string;
  unit_name?: string;
  unit_code?: string;
  working_city?: string;
  image_name: string;
  image_raw: string;
  image_path: string;
  image_url: string;
  comments: string;
  reject: number;
  status: string;
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

// ─── Screen ─────────────────────────────────────────────────────
export const DocumentVerifyScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const insets = useSafeAreaInsets();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const hasCached = documentVerifyCache.records.length > 0;
  const [docs, setDocs] = useState<DocRecord[]>(
    hasCached ? documentVerifyCache.records : []
  );
  const [masterUnits, setMasterUnits] = useState<BackendUnit[]>([]);
  const [loading, setLoading] = useState(!hasCached);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  // Preview modal
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Reject bottom sheet
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<DocRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Approve confirm
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveTarget, setApproveTarget] = useState<DocRecord | null>(null);

  // ─── fetch ────────────────────────────────────────────────────
  // Uses /api/hr/android-documents/ + /api/masters/units/ + /api/hr/employees/ in parallel
  // This guarantees each employee's real unit/branch is resolved even if hr_document_verification table has no unit column!
  const fetchDocs = useCallback(async () => {
    try {
      const [docRes, unitRes, empRes] = await Promise.allSettled([
        apiClient.get<any>('/api/hr/android-documents/'),
        superadminApi.getUnits('', 1, 100),
        apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?page=1&page_size=300`),
      ]);

      // 1. Build Unit lookup map: unit_code -> { code, name }
      const unitMap = new Map<string, { code: string; name: string }>();
      if (unitRes.status === 'fulfilled' && unitRes.value.success && unitRes.value.data) {
        const uList = Array.isArray(unitRes.value.data)
          ? unitRes.value.data
          : (unitRes.value.data as any).results || [];
        setMasterUnits(uList);
        uList.forEach((u: any) => {
          const c = String(u.unit_code || '').trim().toUpperCase();
          const n = String(u.unit_name || '').trim();
          if (c) unitMap.set(c, { code: c, name: n || c });
        });
      }

      // 2. Build Employee lookup map: emp_code -> { emp_name, unit_code, unit_name, city }
      const empMap = new Map<string, { emp_name: string; unit_code: string; unit_name: string; city: string }>();
      if (empRes.status === 'fulfilled' && empRes.value.success && empRes.value.data) {
        const eData = empRes.value.data;
        const eList = Array.isArray(eData) ? eData : eData.results || [];
        eList.forEach((e: any) => {
          const eCode = String(e.emp_code || '').trim().toUpperCase();
          const uCode = String(e.unit_code || '').trim().toUpperCase();
          const matchedUnit = unitMap.get(uCode);
          const uName = matchedUnit ? matchedUnit.name : (uCode || '');
          if (eCode) {
            empMap.set(eCode, {
              emp_name: e.emp_name || '',
              unit_code: uCode,
              unit_name: uName,
              city: e.location_city || e.location || e.emp_current_city || '',
            });
          }
        });
      }

      // 3. Normalise Document Records with resolved Unit and Employee details
      if (docRes.status === 'fulfilled' && docRes.value.success && docRes.value.data) {
        const raw = Array.isArray(docRes.value.data.results)
          ? docRes.value.data.results
          : Array.isArray(docRes.value.data)
          ? docRes.value.data
          : [];

        const list: DocRecord[] = raw.map((r: any) => {
          const rawCode = String(r.emp_code || '').trim().toUpperCase();
          const empMeta = empMap.get(rawCode);

          const rawUnit = String(r.unit_name || r.unit_code || '').trim();
          const resolvedUnitCode = empMeta?.unit_code || (unitMap.has(rawUnit.toUpperCase()) ? rawUnit : '');
          const resolvedUnitName =
            (rawUnit && unitMap.get(rawUnit.toUpperCase())?.name) ||
            empMeta?.unit_name ||
            (rawUnit && rawUnit !== 'Unassigned' ? rawUnit : '') ||
            (resolvedUnitCode ? (unitMap.get(resolvedUnitCode.toUpperCase())?.name || resolvedUnitCode) : 'General Unit');

          const resolvedEmpName = r.emp_name || empMeta?.emp_name || (rawCode ? `Employee ${rawCode}` : 'Staff Member');
          const resolvedCity = r.working_city || empMeta?.city || '';

          return {
            id:           r.id,
            emp_code:     r.emp_code || '',
            emp_name:     resolvedEmpName,
            client_name:  r.client_name || '',
            unit_code:    resolvedUnitCode,
            unit_name:    resolvedUnitName,
            working_city: resolvedCity,
            image_name:   DOC_LABEL[r.image_name] || r.image_name || '',
            image_raw:    r.image_name || '',
            image_path:   r.image_path || '',
            image_url:    r.image_path ? `/media/${r.image_path}` : '',
            comments:     r.comments || '',
            reject:       r.reject ?? 0,
            status:       STATUS_CFG[r.reject ?? 0]?.label || 'Pending',
          };
        });
        setDocs(list);
        documentVerifyCache.records = list;
        documentVerifyCache.timestamp = Date.now();
      } else if (docRes.status === 'fulfilled' && !docRes.value.success) {
        showToast({ type: 'error', title: 'Load Failed', message: docRes.value.error || 'Could not fetch documents.' });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Network Error', message: e?.message || 'Connection failed.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  const onRefresh = () => { setRefreshing(true); fetchDocs(); };

  // ─── approve ─────────────────────────────────────────────────
  const handleApprove = (doc: DocRecord) => {
    setApproveTarget(doc);
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setApproveModalVisible(false);
    setActionLoading(true);
    try {
      const res = await apiClient.patch<any>(
        `/api/hr/android-documents/${approveTarget.id}/`,
        { reject: 2, comments: 'Approved Document', android_flag: 1 }
      );
      if (res.success) {
        showToast({
          type: 'success', title: 'Approved',
          message: `${DOC_LABEL[approveTarget.image_raw] || approveTarget.image_name} approved successfully.`,
        });
        setDocs(prev => prev.map(d =>
          d.id === approveTarget.id ? { ...d, reject: 2, status: 'Approved', comments: 'Approved Document' } : d
        ));
      } else {
        showToast({ type: 'error', title: 'Approve Failed', message: res.error || 'Could not approve.' });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Error', message: e?.message || 'Network error.' });
    } finally {
      setActionLoading(false);
      setApproveTarget(null);
    }
  };

  // ─── reject ──────────────────────────────────────────────────
  const openRejectModal = (doc: DocRecord) => {
    setRejectTarget(doc);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast({ type: 'warning', title: 'Reason Required', message: 'Please enter a rejection reason.' });
      return;
    }
    setRejectModalVisible(false);
    setActionLoading(true);
    try {
      const res = await apiClient.patch<any>(
        `/api/hr/android-documents/${rejectTarget.id}/`,
        { reject: 1, comments: rejectReason.trim(), android_flag: 1 }
      );
      if (res.success) {
        showToast({ type: 'success', title: 'Rejected', message: 'Document rejected.' });
        setDocs(prev => prev.map(d =>
          d.id === rejectTarget.id ? { ...d, reject: 1, status: 'Rejected', comments: rejectReason.trim() } : d
        ));
      } else {
        showToast({ type: 'error', title: 'Reject Failed', message: res.error || 'Could not reject.' });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Error', message: e?.message || 'Network error.' });
    } finally {
      setActionLoading(false);
      setRejectTarget(null);
      setRejectReason('');
    }
  };

  // Distinct units for horizontal filtering tabs (pre-fetched from units API + document units)
  const unitOptions = useMemo(() => {
    const list: Array<{ code: string; label: string; count: number }> = [
      { code: 'ALL', label: 'All Units', count: docs.length },
    ];

    const seenUnits = new Set<string>();

    // 1. Master units from API
    masterUnits.forEach(u => {
      const uCode = (u.unit_code || '').trim();
      const uName = (u.unit_name || '').trim();
      const key = (uCode || uName).toUpperCase();
      if (key && !seenUnits.has(key)) {
        seenUnits.add(key);
        // Calculate count by code or by name
        const count = docs.filter(d => {
          const dCode = (d.unit_code || '').toUpperCase();
          const dName = (d.unit_name || '').toUpperCase();
          return (uCode && dCode === uCode.toUpperCase()) ||
                 (uName && dName === uName.toUpperCase()) ||
                 (uCode && dName.includes(uCode.toUpperCase()));
        }).length;

        list.push({
          code: uCode || uName,
          label: uName ? `${uName} (${uCode})` : uCode,
          count,
        });
      }
    });

    // 2. Add any distinct unit from documents not in master
    docs.forEach(d => {
      const uCode = (d.unit_code || '').trim();
      const uName = (d.unit_name || '').trim();
      const key = (uCode || uName).toUpperCase();
      if (key && !seenUnits.has(key) && key !== 'GENERAL UNIT') {
        seenUnits.add(key);
        const count = docs.filter(doc => (doc.unit_code || doc.unit_name || '').toUpperCase() === key).length;
        list.push({
          code: uCode || uName,
          label: uName || uCode,
          count,
        });
      }
    });

    return list;
  }, [docs, masterUnits]);

  // ─── filtered list ────────────────────────────────────────────
  const filtered = docs.filter(doc => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      doc.emp_code.toLowerCase().includes(q) ||
      doc.emp_name.toLowerCase().includes(q) ||
      (doc.unit_name || '').toLowerCase().includes(q) ||
      (doc.unit_code || '').toLowerCase().includes(q) ||
      (doc.image_name || '').toLowerCase().includes(q);

    const docCode = (doc.unit_code || '').toUpperCase();
    const docName = (doc.unit_name || '').toUpperCase();
    const sel = selectedUnit.toUpperCase();

    const matchUnit =
      sel === 'ALL' ||
      (docCode && docCode === sel) ||
      (docName && docName.includes(sel)) ||
      (docName && sel.includes(docName));

    const rv = doc.reject ?? 0;
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING'  && rv === 0) ||
      (filterStatus === 'APPROVED' && rv === 2) ||
      (filterStatus === 'REJECTED' && rv === 1);

    return matchSearch && matchUnit && matchStatus;
  });

  const pendingCount  = docs.filter(d => (d.reject ?? 0) === 0).length;
  const approvedCount = docs.filter(d => (d.reject ?? 0) === 2).length;
  const rejectedCount = docs.filter(d => (d.reject ?? 0) === 1).length;

  // ─── render card ─────────────────────────────────────────────
  const renderItem = ({ item }: { item: DocRecord }) => {
    const rv = item.reject ?? 0;
    const st = STATUS_CFG[rv] ?? STATUS_CFG[0];
    const docLabel = DOC_LABEL[item.image_raw] || item.image_name || 'Document';
    const docIcon  = DOC_ICON[item.image_raw] || 'document';
    const imgUrl   = item.image_url ? apiConfig.getEndpoint(item.image_url) : null;
    const isPending = rv === 0;
    const initials = (item.emp_name || item.emp_code || '?').substring(0, 2).toUpperCase();

    return (
      <View style={styles.card}>
        {/* ── 1. Card Top Row: Avatar + Employee Name + ID + Unit + Status Badge ── */}
        <View style={styles.cardTopRow}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>{initials}</Text>
          </View>
          <View style={styles.empMeta}>
            <View style={styles.empNameRow}>
              <Text style={styles.empName} numberOfLines={1}>{item.emp_name || 'Staff Member'}</Text>
              <View style={[styles.statusPill, { backgroundColor: st.bg, borderColor: st.border }]}>
                <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                <Text style={[styles.statusPillText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
            <View style={styles.metaSubRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{item.emp_code}</Text>
              </View>
              <View style={styles.unitPill}>
                <AppIcon name="unit" size={10} color="#0F766E" />
                <Text style={styles.unitPillText}>{item.unit_name || item.unit_code || 'General Unit'}</Text>
              </View>
              {item.working_city ? (
                <View style={styles.cityBadge}>
                  <AppIcon name="map-pin" size={10} color="#64748B" />
                  <Text style={styles.cityBadgeText}>{item.working_city}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── 2. Document Banner Row ── */}
        <View style={styles.docTypeBanner}>
          <View style={styles.docIconWrap}>
            <AppIcon name={docIcon} size={15} color="#0F766E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docTypeText}>{docLabel}</Text>
            <Text style={styles.docSubText}>KYC Identity Verification</Text>
          </View>
          {imgUrl ? (
            <TouchableOpacity
              style={styles.viewDocBadge}
              onPress={() => { setPreviewDoc(item); setPreviewVisible(true); }}
              activeOpacity={0.8}
            >
              <AppIcon name="search" size={11} color="#0F766E" />
              <Text style={styles.viewDocText}>Full View</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── 3. Rejection Reason Banner (if rejected) ── */}
        {rv === 1 && !!item.comments && (
          <View style={styles.rejectComment}>
            <AppIcon name="alert" size={13} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectCommentTitle}>Rejection Reason:</Text>
              <Text style={styles.rejectCommentText}>{item.comments}</Text>
            </View>
          </View>
        )}

        {/* ── 4. Document Preview Box ── */}
        <TouchableOpacity
          style={[styles.previewCardWrap, !imgUrl && styles.previewCardWrapEmpty]}
          onPress={() => { if (imgUrl) { setPreviewDoc(item); setPreviewVisible(true); } }}
          activeOpacity={imgUrl ? 0.85 : 1}
        >
          {imgUrl ? (
            <>
              <Image source={{ uri: imgUrl }} style={styles.previewCardImage} resizeMode="cover" />
              <View style={styles.previewCardOverlay}>
                <View style={styles.previewCardPill}>
                  <AppIcon name="eye" size={13} color="#FFFFFF" />
                  <Text style={styles.previewCardPillText}>Tap to inspect document</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyPreviewBox}>
              <AppIcon name="document" size={26} color="#94A3B8" />
              <Text style={styles.emptyPreviewText}>Document image not loaded</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── 5. Action Footer ── */}
        {isPending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <AppIcon name="check" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText} numberOfLines={1}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => openRejectModal(item)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <AppIcon name="close" size={14} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]} numberOfLines={1}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.verifiedStatusBanner, { backgroundColor: st.bg, borderColor: st.border }]}>
            <AppIcon name={rv === 2 ? 'check-circle' : 'close'} size={14} color={st.color} />
            <Text style={[styles.verifiedStatusText, { color: st.color }]} numberOfLines={1}>
              {rv === 2 ? 'Document Verified & Approved' : 'Document Rejected'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────
  return (
    <AppScreenContainer
      backgroundColor="#F8FAFC"
      barStyle="dark-content"
      header={
        <AppHeader
          title="Document Verify"
          subtitle="Review & approve employee KYC documents"
          onBack={goBack}
        />
      }
    >
      {/* ── Summary KPI Tiles (All / Pending / Approved / Rejected) ── */}
      <View style={styles.summaryRow}>
        {([
          { key: 'ALL', label: 'All Docs', count: docs.length, color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', icon: 'document' },
          { key: 'PENDING', label: 'Pending', count: pendingCount, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: 'clock' },
          { key: 'APPROVED', label: 'Approved', count: approvedCount, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: 'check-circle' },
          { key: 'REJECTED', label: 'Rejected', count: rejectedCount, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: 'close' },
        ] as const).map(t => {
          const isSel = filterStatus === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.summaryTile,
                isSel && { backgroundColor: t.bg, borderColor: t.color, borderWidth: 2 },
              ]}
              onPress={() => setFilterStatus(t.key)}
              activeOpacity={0.8}
            >
              <View style={styles.summaryTop}>
                <Text style={[styles.summaryCount, { color: t.color }]}>{t.count}</Text>
                <AppIcon name={t.icon} size={13} color={t.color} />
              </View>
              <Text style={[styles.summaryLabel, isSel && { color: t.color, fontWeight: '800' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrap}>
          <AppIcon name="search" size={16} color="#0F766E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by worker name, ID, doc or unit..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="close" size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Unit Tabs (Pre-fetched from Units Master) ── */}
      <View style={styles.unitTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.unitFilterScroll}
        >
          {unitOptions.map((opt) => {
            const isSel = selectedUnit === opt.code;
            return (
              <TouchableOpacity
                key={opt.code}
                style={[styles.unitChip, isSel && styles.unitChipActive]}
                onPress={() => setSelectedUnit(opt.code)}
                activeOpacity={0.75}
              >
                <AppIcon
                  name={opt.code === 'ALL' ? 'users' : 'unit'}
                  size={12}
                  color={isSel ? '#FFFFFF' : '#0F766E'}
                />
                <Text style={[styles.unitChipText, isSel && styles.unitChipTextActive]}>
                  {opt.label}
                </Text>
                <View style={[styles.unitCountBadge, isSel && styles.unitCountBadgeActive]}>
                  <Text style={[styles.unitCountBadgeText, isSel && styles.unitCountBadgeTextActive]}>
                    {opt.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Count banner ── */}
      <View style={styles.countBanner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.countDot} />
          <Text style={styles.countBannerText}>
            {filtered.length} {filtered.length === 1 ? 'Document' : 'Documents'}
            {selectedUnit !== 'ALL' ? ` • ${selectedUnit}` : ''}
            {filterStatus !== 'ALL' ? ` • ${filterStatus}` : ''}
          </Text>
        </View>
        {actionLoading && <ActivityIndicator size="small" color="#0F766E" />}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0F766E" />
          <Text style={styles.loadingText}>Loading KYC documents from backend...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} tintColor="#0F766E" />
          }
        >
          <View style={styles.centerBox}>
            <AppIcon name="document" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Documents Found</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus !== 'ALL'
                ? `No ${filterStatus.toLowerCase()} documents found for the selected filters.`
                : 'No documents uploaded for this unit yet.'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} tintColor="#0F766E" />
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + ms(40) }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Full image preview modal ── */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewVisible(false)}
        >
          <View style={styles.previewBox}>
            {previewDoc?.image_url ? (
              <Image
                source={{ uri: apiConfig.getEndpoint(previewDoc.image_url) }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.previewMeta}>
              <Text style={styles.previewName}>
                {previewDoc?.emp_name} ({previewDoc?.emp_code})
              </Text>
              <Text style={styles.previewDocType}>
                {DOC_LABEL[previewDoc?.image_raw || ''] || previewDoc?.image_name}
              </Text>
            </View>
            {previewDoc && (previewDoc.reject ?? 0) === 0 && (
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn, { flex: 1 }]}
                  onPress={() => { setPreviewVisible(false); handleApprove(previewDoc); }}
                  activeOpacity={0.8}
                >
                  <AppIcon name="check" size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]}
                  onPress={() => { setPreviewVisible(false); openRejectModal(previewDoc); }}
                  activeOpacity={0.8}
                >
                  <AppIcon name="close" size={14} color="#DC2626" />
                  <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Reject reason bottom sheet ── */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rejection Reason</Text>
            {rejectTarget && (
              <Text style={styles.sheetSubtitle}>
                {DOC_LABEL[rejectTarget.image_raw] || rejectTarget.image_name}
                {' — '}{rejectTarget.emp_name}
              </Text>
            )}
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for rejection..."
              placeholderTextColor="#94A3B8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn, { flex: 1 }]}
                onPress={() => setRejectModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.confirmRejectBtn, { flex: 1 }]}
                onPress={confirmReject}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                <AppIcon name="close" size={13} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Approve confirm modal ── */}
      <CustomAlertModal
        visible={approveModalVisible}
        type="success"
        title="Approve Document?"
        message={
          approveTarget
            ? `Approve ${DOC_LABEL[approveTarget.image_raw] || approveTarget.image_name} for ${approveTarget.emp_name}?`
            : ''
        }
        buttons={[
          {
            text: 'Approve',
            style: 'default',
            onPress: confirmApprove,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => { setApproveModalVisible(false); setApproveTarget(null); },
          },
        ]}
        onClose={() => { setApproveModalVisible(false); setApproveTarget(null); }}
      />
    </AppScreenContainer>
  );
};

// ─── Styles — Global Theme Consistent with WorkersList & Enterprise Theme ─
const styles = StyleSheet.create({
  // ── Summary KPI Tiles ──
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: ms(8),
  },
  summaryTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingVertical: ms(10),
    paddingHorizontal: ms(8),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  summaryCount: {
    fontSize: ms(18),
    fontWeight: '800',
    lineHeight: ms(22),
  },
  summaryLabel: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#64748B',
    marginTop: ms(2),
  },

  // ── Search Section ──
  searchSection: {
    paddingHorizontal: spacing.md,
    marginTop: ms(10),
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: ms(12),
    height: ms(44),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: ms(13),
    color: '#0F172A',
    marginLeft: ms(8),
    paddingVertical: 0,
  },
  clearBtn: {
    padding: ms(4),
  },

  // ── Unit Tabs ──
  unitTabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: ms(8),
    marginTop: ms(8),
  },
  unitFilterScroll: {
    paddingHorizontal: spacing.md,
    gap: ms(8),
    alignItems: 'center',
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  unitChipText: {
    fontSize: ms(11),
    fontWeight: '600',
    color: '#334155',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  unitCountBadge: {
    paddingHorizontal: ms(6),
    paddingVertical: ms(1.5),
    borderRadius: borderRadius.full,
    backgroundColor: '#E2E8F0',
    minWidth: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  unitCountBadgeText: {
    fontSize: ms(9),
    fontWeight: '800',
    color: '#475569',
  },
  unitCountBadgeTextActive: {
    color: '#FFFFFF',
  },

  // ── Count Banner ──
  countBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: ms(8),
  },
  countDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: '#0F766E',
  },
  countBannerText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#64748B',
  },

  // ── List ──
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: ms(40),
    paddingTop: ms(2),
  },

  // ── Document Verify Feature Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(14),
    marginBottom: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
    gap: ms(10),
  },
  empAvatar: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  empAvatarText: {
    fontSize: ms(14),
    fontWeight: '800',
    color: '#0F766E',
  },
  empMeta: { flex: 1 },
  empNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(6),
  },
  empName: {
    fontSize: ms(14),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  statusPillText: {
    fontSize: ms(10),
    fontWeight: '800',
  },
  metaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: ms(4),
    flexWrap: 'wrap',
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeBadgeText: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#334155',
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    backgroundColor: '#F0FDFA',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  unitPillText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#0F766E',
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cityBadgeText: {
    fontSize: ms(10),
    color: '#64748B',
    fontWeight: '600',
  },

  // Document Type Banner
  docTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: ms(8),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  docIconWrap: {
    width: ms(30),
    height: ms(30),
    borderRadius: borderRadius.sm,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeText: {
    fontSize: ms(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  docSubText: {
    fontSize: ms(10),
    fontWeight: '600',
    color: '#64748B',
  },
  viewDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: borderRadius.sm,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  viewDocText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#0F766E',
  },

  // Document Preview Box
  previewCardWrap: {
    height: ms(150),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewCardWrapEmpty: {
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  previewCardImage: {
    width: '100%',
    height: '100%',
  },
  previewCardOverlay: {
    position: 'absolute',
    bottom: ms(8),
    alignSelf: 'center',
  },
  previewCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: borderRadius.full,
  },
  previewCardPillText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyPreviewBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
  },
  emptyPreviewText: {
    fontSize: ms(12),
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Rejection Comment Callout
  rejectComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(8),
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: ms(10),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectCommentTitle: {
    fontSize: ms(11),
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: ms(2),
  },
  rejectCommentText: {
    fontSize: ms(12),
    color: '#B91C1C',
    lineHeight: ms(16),
  },

  // Action Footer
  actionRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginTop: ms(6),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(10),
    paddingHorizontal: ms(8),
    borderRadius: borderRadius.md,
    gap: ms(6),
    minHeight: ms(38),
  },
  approveBtn: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  confirmRejectBtn: {
    backgroundColor: '#DC2626',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlign: 'center',
  },
  verifiedStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    paddingVertical: ms(9),
    paddingHorizontal: ms(12),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: ms(4),
  },
  verifiedStatusText: {
    fontSize: ms(12),
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
  },

  // ── Empty / Loading ──
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ms(80),
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: ms(13),
    color: colors.textSecondary,
    marginTop: ms(12),
  },
  emptyTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: ms(12),
  },
  emptySubtitle: {
    fontSize: ms(13),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: ms(6),
    lineHeight: ms(18),
  },

  // ── Preview Modal ──
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  previewBox: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    padding: ms(14),
  },
  previewImage: {
    width: '100%',
    height: ms(340),
    borderRadius: borderRadius.lg,
    backgroundColor: '#0F172A',
  },
  previewMeta: {
    paddingVertical: ms(10),
  },
  previewName: {
    fontSize: ms(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  previewDocType: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#0F766E',
    marginTop: ms(2),
  },
  previewActions: {
    flexDirection: 'row',
    gap: ms(10),
    paddingTop: ms(6),
  },

  // ── Reject Sheet ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: ms(36),
  },
  sheetHandle: {
    width: ms(40),
    height: ms(4),
    backgroundColor: '#CBD5E1',
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: ms(14),
  },
  sheetTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: ms(12),
    color: '#64748B',
    marginTop: ms(2),
    marginBottom: ms(14),
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ms(12),
    fontSize: ms(13),
    color: '#0F172A',
    minHeight: ms(80),
    textAlignVertical: 'top',
    marginBottom: ms(14),
  },
  sheetBtns: {
    flexDirection: 'row',
    gap: ms(10),
  },
});
