import React, { useState, useEffect, useCallback } from 'react';
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
import { apiConfig } from '../../../api/config';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, ms } from '../../../theme';

// ─── helpers ────────────────────────────────────────────────────
type RejectVal = 0 | 1 | 2;

const STATUS_CFG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Pending',  color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  1: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  2: { label: 'Approved', color: '#16A34A', bg: '#DCFCE7', border: '#A7F3D0' },
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

  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
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
  // Uses /api/hr/android-documents/ — the Django ORM viewset that reads
  // hr_document_verification (where mobile uploads actually land).
  // No query param = returns ALL records for the caller's comp_code (Company Admin scope).
  const fetchDocs = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/api/hr/android-documents/');
      if (res.success && res.data) {
        const raw = Array.isArray(res.data.results)
          ? res.data.results
          : Array.isArray(res.data)
          ? res.data
          : [];
        // Normalise to DocRecord shape (ORM fields differ slightly from legacy SQL)
        const list: DocRecord[] = raw.map((r: any) => ({
          id:           r.id,
          emp_code:     r.emp_code || '',
          emp_name:     r.emp_name || '',
          client_name:  r.client_name || '',
          unit_name:    r.unit_name || '',
          working_city: r.working_city || '',
          image_name:   DOC_LABEL[r.image_name] || r.image_name || '',
          image_raw:    r.image_name || '',
          image_path:   r.image_path || '',
          // image_path from ORM is under employee_docs/ — served via /media/
          image_url:    r.image_path ? `/media/${r.image_path}` : '',
          comments:     r.comments || '',
          reject:       r.reject ?? 0,
          status:       STATUS_CFG[r.reject ?? 0]?.label || 'Pending',
        }));
        setDocs(list);
      } else {
        showToast({ type: 'error', title: 'Load Failed', message: res.error || 'Could not fetch documents.' });
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
      // PATCH reject=2 directly on the ORM record (hr_document_verification)
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
      // PATCH reject=1 + comments on the ORM record (hr_document_verification)
      const res = await apiClient.patch<any>(
        `/api/hr/android-documents/${rejectTarget.id}/`,
        { reject: 1, comments: rejectReason.trim(), android_flag: 1 }
      );
      if (res.success) {
        showToast({ type: 'success', title: 'Rejected', message: 'Document rejected.' });
        setDocs(prev => prev.map(d =>
          d.id === rejectTarget.id ? { ...d, reject: 1, status: 'Reject', comments: rejectReason.trim() } : d
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

  // ─── filtered list ────────────────────────────────────────────
  const filtered = docs.filter(doc => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      doc.emp_code.toLowerCase().includes(q) ||
      doc.emp_name.toLowerCase().includes(q) ||
      (doc.unit_name || '').toLowerCase().includes(q);

    const rv = doc.reject ?? 0;
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING'  && rv === 0) ||
      (filterStatus === 'APPROVED' && rv === 2) ||
      (filterStatus === 'REJECTED' && rv === 1);

    return matchSearch && matchStatus;
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
        {/* ── Employee Row ── */}
        <View style={styles.cardTopRow}>
          <View style={[styles.empAvatar, { backgroundColor: `${brandColor}18` }]}>
            <Text style={[styles.empAvatarText, { color: brandColor }]}>{initials}</Text>
          </View>
          <View style={styles.empMeta}>
            <Text style={styles.empName} numberOfLines={1}>{item.emp_name || '—'}</Text>
            <Text style={styles.empSub} numberOfLines={1}>
              {item.emp_code}
              {item.unit_name ? `  •  ${item.unit_name}` : ''}
              {item.working_city ? `  •  ${item.working_city}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.statusPillText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* ── Doc type row ── */}
        <View style={styles.docTypeRow}>
          <View style={[styles.docIconWrap, { backgroundColor: `${brandColor}12` }]}>
            <AppIcon name={docIcon} size={14} color={brandColor} />
          </View>
          <Text style={[styles.docTypeText, { color: brandColor }]}>{docLabel}</Text>
        </View>

        {/* ── Rejection comment ── */}
        {rv === 1 && !!item.comments && (
          <View style={styles.rejectComment}>
            <AppIcon name="alert" size={12} color="#DC2626" />
            <Text style={styles.rejectCommentText} numberOfLines={2}>{item.comments}</Text>
          </View>
        )}

        {/* ── Thumbnail + action buttons ── */}
        <View style={styles.cardBottom}>
          <TouchableOpacity
            style={[styles.thumb, !imgUrl && styles.thumbEmpty]}
            onPress={() => { if (imgUrl) { setPreviewDoc(item); setPreviewVisible(true); } }}
            activeOpacity={imgUrl ? 0.8 : 1}
          >
            {imgUrl ? (
              <>
                <Image source={{ uri: imgUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={styles.thumbEyeOverlay}>
                  <AppIcon name="eye" size={14} color="#FFFFFF" />
                </View>
              </>
            ) : (
              <AppIcon name="document" size={22} color="#CBD5E1" />
            )}
          </TouchableOpacity>

          <View style={styles.actionCol}>
            {isPending ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <AppIcon name="check" size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => openRejectModal(item)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <AppIcon name="close" size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[styles.actionBtn, { backgroundColor: st.bg, borderWidth: 1, borderColor: st.border }]}>
                <AppIcon name={rv === 2 ? 'check-circle' : 'close'} size={13} color={st.color} />
                <Text style={[styles.actionBtnText, { color: st.color }]}>{st.label}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────
  return (
    <AppScreenContainer
      backgroundColor={colors.background}
      barStyle="dark-content"
      header={
        <AppHeader
          title="Document Verify"
          subtitle="Review & approve employee KYC documents"
          onBack={goBack}
          rightActionIcon="refresh"
          onRightAction={onRefresh}
        />
      }
    >
      {/* ── Summary tiles ── */}
      <View style={styles.summaryRow}>
        {([
          { key: 'PENDING',  label: 'Pending',  count: pendingCount,  color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
          { key: 'APPROVED', label: 'Approved', count: approvedCount, color: '#16A34A', bg: '#DCFCE7', border: '#A7F3D0' },
          { key: 'REJECTED', label: 'Rejected', count: rejectedCount, color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.summaryTile,
              filterStatus === t.key && { backgroundColor: t.bg, borderColor: t.border },
            ]}
            onPress={() => setFilterStatus(f => f === t.key ? 'ALL' : t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.summaryCount, { color: t.color }]}>{t.count}</Text>
            <Text style={styles.summaryLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <AppIcon name="search" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, code or unit..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppIcon name="close" size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterStatus[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filterStatus === f && { backgroundColor: brandColor, borderColor: brandColor }]}
            onPress={() => setFilterStatus(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, filterStatus === f && { color: '#FFFFFF' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Count banner ── */}
      <View style={styles.countBanner}>
        <Text style={styles.countBannerText}>
          {filtered.length} document{filtered.length !== 1 ? 's' : ''} found
        </Text>
        {actionLoading && <ActivityIndicator size="small" color={brandColor} />}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <AppIcon name="document" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Documents Found</Text>
          <Text style={styles.emptySubtitle}>
            {filterStatus !== 'ALL'
              ? `No ${filterStatus.toLowerCase()} documents.`
              : 'No documents uploaded by employees yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandColor]} />
          }
          contentContainerStyle={styles.listContent}
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
                  <AppIcon name="close" size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Reject</Text>
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
                style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]}
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

// ─── Styles — matches WorkersList / AdminSalarySlip global theme ─
const styles = StyleSheet.create({
  // ── Summary ──
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: ms(10),
  },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: ms(12),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCount: {
    fontSize: ms(22),
    fontWeight: '800',
    lineHeight: ms(26),
  },
  summaryLabel: {
    fontSize: ms(10),
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: ms(2),
  },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: ms(12),
    paddingVertical: ms(0),
    height: ms(44),
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: ms(8),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(14),
    color: colors.textPrimary,
    paddingVertical: 0,
  },

  // ── Chips ──
  chipScroll: { maxHeight: ms(44) },
  chipContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: ms(6),
    gap: ms(8),
  },
  chip: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // ── Count banner ──
  countBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: ms(6),
  },
  countBannerText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textMuted,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: ms(40),
    paddingTop: ms(2),
  },

  // ── Card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  empAvatarText: {
    fontSize: ms(15),
    fontWeight: '800',
  },
  empMeta: { flex: 1 },
  empName: {
    fontSize: ms(14),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  empSub: {
    fontSize: ms(11),
    color: colors.textSecondary,
    marginTop: ms(2),
  },
  statusPill: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: ms(10),
    fontWeight: '800',
  },

  // Doc type row
  docTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(10),
  },
  docIconWrap: {
    width: ms(26),
    height: ms(26),
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeText: {
    fontSize: ms(12),
    fontWeight: '700',
  },

  // Reject comment
  rejectComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(6),
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: ms(10),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectCommentText: {
    flex: 1,
    fontSize: ms(12),
    color: '#B91C1C',
    lineHeight: ms(17),
  },

  // Card bottom: thumbnail + buttons
  cardBottom: {
    flexDirection: 'row',
    gap: ms(10),
    alignItems: 'flex-start',
  },
  thumb: {
    width: ms(72),
    height: ms(72),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmpty: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  thumbEyeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCol: { flex: 1, gap: ms(8) },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(9),
    paddingHorizontal: ms(12),
    borderRadius: borderRadius.md,
    gap: ms(6),
  },
  approveBtn: { backgroundColor: '#16A34A' },
  rejectBtn:  { backgroundColor: '#DC2626' },
  cancelBtn:  { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border },
  actionBtnText: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#FFFFFF',
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
    marginTop: ms(16),
  },
  emptySubtitle: {
    fontSize: ms(13),
    color: colors.textMuted,
    marginTop: ms(6),
    textAlign: 'center',
  },

  // ── Preview modal ──
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    maxHeight: '82%',
  },
  previewImage: {
    width: '100%',
    height: ms(320),
    backgroundColor: colors.surfaceVariant,
  },
  previewMeta: {
    paddingHorizontal: spacing.md,
    paddingVertical: ms(12),
  },
  previewName: {
    fontSize: ms(14),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  previewDocType: {
    fontSize: ms(12),
    color: colors.textSecondary,
    marginTop: ms(2),
  },
  previewActions: {
    flexDirection: 'row',
    gap: ms(10),
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  // ── Reject sheet ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: ms(36),
  },
  sheetHandle: {
    width: ms(40),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: ms(4),
  },
  sheetSubtitle: {
    fontSize: ms(12),
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  reasonInput: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: ms(14),
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: ms(80),
    marginBottom: spacing.md,
  },
  sheetBtns: { flexDirection: 'row', gap: ms(10) },
});
