import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppScreenContainer } from '../../../components/common/AppScreenContainer';
import { AppHeader } from '../../../components/common/AppHeader';
import { AppIcon } from '../../../components/common/AppIcon';
import {
  complaintApi,
  AdminComplaintItem,
  superadminApi,
  BackendUnit,
} from '../../../api';
import { showToast } from '../../../store/toastStore';
import { useNavigation } from '../../../navigation/navigationContext';
import { styles } from './AdminComplaintScreen.styles';

export const AdminComplaintScreen: React.FC = () => {
  const { goBack } = useNavigation();

  const [complaints, setComplaints] = useState<AdminComplaintItem[]>([]);
  const [units, setUnits] = useState<BackendUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, IN_PROCESS, RESOLVED
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL'); // ALL, TOP, MEDIUM, LOW

  // Resolve Modal State
  const [selectedTicket, setSelectedTicket] = useState<AdminComplaintItem | null>(null);
  const [adminComment, setAdminComment] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);

  // Fetch Complaints & Units in Parallel
  const loadData = useCallback(async (isPull = false) => {
    if (isPull) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [res, unitsRes] = await Promise.all([
        complaintApi.getAdminComplaints(),
        superadminApi.getUnits().catch(() => ({ success: false, data: [] })),
      ]);

      if (res.success && res.data) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }

      if (unitsRes.success && unitsRes.data) {
        const list: BackendUnit[] = Array.isArray(unitsRes.data) ? unitsRes.data : [];
        setUnits(list);
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Failed to fetch tickets', type: 'error' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Resolve Submission
  const handleResolveSubmit = async () => {
    if (!selectedTicket) return;
    if (!adminComment.trim()) {
      showToast({ message: 'Please enter resolution comment / reply', type: 'warning' });
      return;
    }

    setIsResolving(true);
    try {
      const res = await complaintApi.resolveComplaint(selectedTicket.Id, adminComment.trim());
      if (res.success) {
        showToast({ message: res.message || 'Ticket resolved successfully', type: 'success' });
        setSelectedTicket(null);
        setAdminComment('');
        loadData();
      } else {
        showToast({ message: res.message || 'Failed to resolve ticket', type: 'error' });
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Network error occurred', type: 'error' });
    } finally {
      setIsResolving(false);
    }
  };

  // Distinct Units list from both Backend Units API and active complaints
  const distinctUnitTabs = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();

    // 1. Units from API
    units.forEach((u) => {
      const name = (u.unit_name || '').trim();
      const code = (u.unit_code || '').trim();
      if (name) {
        map.set(name.toLowerCase(), { code: code || name, name });
      }
    });

    // 2. Units from complaints (ensures every complaint's unit is visible in tabs)
    complaints.forEach((c) => {
      const name = (c.unit_name || '').trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), { code: name, name });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [units, complaints]);

  // Complaints scoped by selected unit
  const unitScopedComplaints = useMemo(() => {
    if (selectedUnit === 'ALL') return complaints;
    return complaints.filter(
      (c) =>
        String(c.unit_name || '').trim().toLowerCase() === selectedUnit.trim().toLowerCase()
    );
  }, [complaints, selectedUnit]);

  // Filtered list applying search + status + priority on top of unit scope
  const filteredList = useMemo(() => {
    return unitScopedComplaints.filter((item) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesUnit = String(item.unit_name || '').toLowerCase().includes(q);
        const matchesClient = String(item.client_name || '').toLowerCase().includes(q);
        const matchesIssue = String(item.complaint_name || '').toLowerCase().includes(q);
        const matchesRemark = String(item.Remark || '').toLowerCase().includes(q);
        const matchesId = String(item.Id).includes(q);
        if (!matchesUnit && !matchesClient && !matchesIssue && !matchesRemark && !matchesId) {
          return false;
        }
      }

      // 2. Status filter
      const st = String(item.status || '').toLowerCase();
      if (statusFilter === 'IN_PROCESS' && !st.includes('process')) return false;
      if (statusFilter === 'RESOLVED' && !st.includes('resolve') && !st.includes('complete')) {
        return false;
      }

      // 3. Priority filter
      const pri = String(item.priority || '').toUpperCase();
      if (priorityFilter !== 'ALL' && !pri.includes(priorityFilter)) return false;

      return true;
    });
  }, [unitScopedComplaints, searchQuery, statusFilter, priorityFilter]);

  // Dynamic counts for KPIs & Tabs per selected unit
  const totalCount = unitScopedComplaints.length;
  const inProcessCount = unitScopedComplaints.filter((c) =>
    String(c.status || '').toLowerCase().includes('process')
  ).length;
  const resolvedCount = unitScopedComplaints.filter(
    (c) =>
      String(c.status || '').toLowerCase().includes('resolve') ||
      String(c.status || '').toLowerCase().includes('complete')
  ).length;

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Complaints & Tickets"
          subtitle="Manage & resolve queries across units"
          onBack={goBack}
        />
      }
      scrollable={false}
    >
      {/* 1. DYNAMIC UNIT FILTER TABS BAR (FIRST - MATCHING LEAVE APPROVAL SCREEN) */}
      <View style={styles.unitFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.unitFilterScroll}
        >
          {/* ALL UNITS TAB */}
          <TouchableOpacity
            style={[
              styles.unitChip,
              selectedUnit === 'ALL' && styles.unitChipActive,
            ]}
            onPress={() => setSelectedUnit('ALL')}
            activeOpacity={0.8}
          >
            <AppIcon
              name="building"
              size={12}
              color={selectedUnit === 'ALL' ? '#FFFFFF' : '#0F766E'}
            />
            <Text
              style={[
                styles.unitChipText,
                selectedUnit === 'ALL' && styles.unitChipTextActive,
              ]}
            >
              All Units
            </Text>
            <View
              style={[
                styles.unitBadge,
                selectedUnit === 'ALL' && styles.unitBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.unitBadgeText,
                  selectedUnit === 'ALL' && styles.unitBadgeTextActive,
                ]}
              >
                {complaints.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* DYNAMIC UNITS FROM BACKEND & TICKETS */}
          {distinctUnitTabs.map((u) => {
            const isSelected = selectedUnit.toLowerCase() === u.name.toLowerCase();
            const uCount = complaints.filter(
              (c) => String(c.unit_name || '').trim().toLowerCase() === u.name.trim().toLowerCase()
            ).length;

            return (
              <TouchableOpacity
                key={u.code || u.name}
                style={[styles.unitChip, isSelected && styles.unitChipActive]}
                onPress={() => setSelectedUnit(u.name)}
                activeOpacity={0.8}
              >
                <AppIcon
                  name="building"
                  size={12}
                  color={isSelected ? '#FFFFFF' : '#0F766E'}
                />
                <Text
                  style={[
                    styles.unitChipText,
                    isSelected && styles.unitChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {u.name}
                </Text>
                <View
                  style={[
                    styles.unitBadge,
                    isSelected && styles.unitBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitBadgeText,
                      isSelected && styles.unitBadgeTextActive,
                    ]}
                  >
                    {uCount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={['#0F766E']}
            tintColor="#0F766E"
          />
        }
      >
        {/* KPI Overview Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalCount}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#FED7AA' }]}>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{inProcessCount}</Text>
            <Text style={styles.kpiLabel}>Active</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#BBF7D0' }]}>
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{resolvedCount}</Text>
            <Text style={styles.kpiLabel}>Resolved</Text>
          </View>
        </View>

        {/* Search Bar (Matching LeaveApprovalScreen searchInputWrap) */}
        <View style={styles.searchWrap}>
          <AppIcon name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Unit, Client, Issue, Ticket ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="x" size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Tabs (Matching LeaveApprovalScreen tabChip style) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusScroll}
        >
          <TouchableOpacity
            style={[
              styles.statusTabChip,
              statusFilter === 'ALL' && styles.statusTabChipActive,
            ]}
            onPress={() => setStatusFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusTabChipText,
                statusFilter === 'ALL' && styles.statusTabChipTextActive,
              ]}
            >
              All Status
            </Text>
            <View
              style={[
                styles.statusTabBadge,
                statusFilter === 'ALL' && styles.statusTabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusTabBadgeText,
                  statusFilter === 'ALL' && styles.statusTabBadgeTextActive,
                ]}
              >
                {totalCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusTabChip,
              statusFilter === 'IN_PROCESS' && styles.statusTabChipActive,
            ]}
            onPress={() => setStatusFilter('IN_PROCESS')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusTabChipText,
                statusFilter === 'IN_PROCESS' && styles.statusTabChipTextActive,
              ]}
            >
              In Process
            </Text>
            <View
              style={[
                styles.statusTabBadge,
                statusFilter === 'IN_PROCESS' && styles.statusTabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusTabBadgeText,
                  statusFilter === 'IN_PROCESS' && styles.statusTabBadgeTextActive,
                ]}
              >
                {inProcessCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusTabChip,
              statusFilter === 'RESOLVED' && styles.statusTabChipActive,
            ]}
            onPress={() => setStatusFilter('RESOLVED')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusTabChipText,
                statusFilter === 'RESOLVED' && styles.statusTabChipTextActive,
              ]}
            >
              Resolved
            </Text>
            <View
              style={[
                styles.statusTabBadge,
                statusFilter === 'RESOLVED' && styles.statusTabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusTabBadgeText,
                  statusFilter === 'RESOLVED' && styles.statusTabBadgeTextActive,
                ]}
              >
                {resolvedCount}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Priority Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.priorityScroll}
        >
          <TouchableOpacity
            style={[
              styles.priorityChip,
              priorityFilter === 'ALL' && styles.priorityChipActive,
            ]}
            onPress={() => setPriorityFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.priorityChipText,
                priorityFilter === 'ALL' && styles.priorityChipTextActive,
              ]}
            >
              All Priorities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priorityChip,
              priorityFilter === 'TOP' && styles.priorityChipActive,
            ]}
            onPress={() => setPriorityFilter('TOP')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.priorityChipText,
                priorityFilter === 'TOP' && styles.priorityChipTextActive,
                priorityFilter === 'TOP' && { color: '#DC2626' },
              ]}
            >
              🚨 Urgent (TOP)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priorityChip,
              priorityFilter === 'MEDIUM' && styles.priorityChipActive,
            ]}
            onPress={() => setPriorityFilter('MEDIUM')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.priorityChipText,
                priorityFilter === 'MEDIUM' && styles.priorityChipTextActive,
                priorityFilter === 'MEDIUM' && { color: '#D97706' },
              ]}
            >
              ⚡ Medium
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priorityChip,
              priorityFilter === 'LOW' && styles.priorityChipActive,
            ]}
            onPress={() => setPriorityFilter('LOW')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.priorityChipText,
                priorityFilter === 'LOW' && styles.priorityChipTextActive,
              ]}
            >
              ℹ️ Low
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Complaints List */}
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginVertical: 40 }} />
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <AppIcon name="ticket" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Complaints Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No tickets match your search query.'
                : 'No tickets available in this category.'}
            </Text>
          </View>
        ) : (
          filteredList.map((item) => {
            const st = String(item.status || '').toLowerCase();
            const isResolved = st.includes('resolve');
            const isComplete = st.includes('complete');
            const isInProcess = !isResolved && !isComplete;

            const priUpper = String(item.priority || '').toUpperCase();

            return (
              <View key={item.Id} style={styles.card}>
                {/* Top Bar: Ticket ID Badge & Date */}
                <View style={styles.cardTopBar}>
                  <View style={styles.ticketBadge}>
                    <AppIcon name="ticket" size={13} color="#0F766E" />
                    <Text style={styles.ticketBadgeText}>#{item.Id}</Text>
                  </View>
                  <Text style={styles.ticketDate}>{item.date || '—'}</Text>
                </View>

                {/* Unit & Client Tag */}
                <View style={styles.unitTagWrap}>
                  <AppIcon name="building" size={13} color="#0F766E" />
                  <Text style={styles.unitTagText} numberOfLines={1}>
                    {item.unit_name || 'Unit'}
                    {item.client_name ? ` • ${item.client_name}` : ''}
                    {item.state_name ? ` (${item.state_name})` : ''}
                  </Text>
                </View>

                {/* Priority & Status Meta Row */}
                <View style={styles.metaRow}>
                  <View
                    style={[
                      priUpper.includes('TOP')
                        ? styles.priBadgeTop
                        : priUpper.includes('MED')
                        ? styles.priBadgeMed
                        : styles.priBadgeLow,
                    ]}
                  >
                    <Text
                      style={[
                        priUpper.includes('TOP')
                          ? styles.priTextTop
                          : priUpper.includes('MED')
                          ? styles.priTextMed
                          : styles.priTextLow,
                      ]}
                    >
                      {priUpper || 'NORMAL'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusChip,
                      isInProcess && styles.statusChipInProcess,
                      isResolved && styles.statusChipResolved,
                      isComplete && styles.statusChipComplete,
                    ]}
                  >
                    <Text
                      style={[
                        isInProcess && styles.statusTextInProcess,
                        isResolved && styles.statusTextResolved,
                        isComplete && styles.statusTextComplete,
                      ]}
                    >
                      {isInProcess
                        ? '⏳ In Process'
                        : isResolved
                        ? '✅ Resolved'
                        : '🔒 Completed'}
                    </Text>
                  </View>
                </View>

                {/* Issue Name */}
                <Text style={styles.issueTitle}>{item.complaint_name || 'General Query'}</Text>

                {/* Worker's Remark */}
                {Boolean(item.Remark) && (
                  <View style={styles.remarkBox}>
                    <Text style={styles.remarkLabel}>Worker Description</Text>
                    <Text style={styles.remarkText}>{item.Remark}</Text>
                  </View>
                )}

                {/* Admin Reply (if exists) */}
                {Boolean(item.comment && item.comment.trim()) && (
                  <View style={styles.adminBox}>
                    <Text style={styles.adminLabel}>Management Response</Text>
                    <Text style={styles.adminText}>{item.comment}</Text>
                  </View>
                )}

                {/* Resolve Action Button for Admin */}
                {isInProcess && (
                  <TouchableOpacity
                    style={styles.resolveBtn}
                    onPress={() => {
                      setSelectedTicket(item);
                      setAdminComment('');
                    }}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="edit" size={13} color="#FFFFFF" />
                    <Text style={styles.resolveBtnText}>Reply & Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* RESOLVE / REPLY BOTTOM MODAL */}
      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Resolve Ticket #{selectedTicket?.Id}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedTicket(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="x" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {selectedTicket?.unit_name} • {selectedTicket?.complaint_name}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter resolution notes, explanation, or action taken..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={adminComment}
              onChangeText={setAdminComment}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedTicket(null)}
                disabled={isResolving}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleResolveSubmit}
                disabled={isResolving}
                activeOpacity={0.8}
              >
                {isResolving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Resolution</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppScreenContainer>
  );
};
