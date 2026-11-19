import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './LeavePolicyScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import {
  superadminApi,
  BackendLeavePolicy,
  BackendLeaveTypeItem,
  BackendUnit,
} from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { useTenantStore } from '../../../store/tenantStore';
import { showToast } from '../../../store/toastStore';

interface EditableLeaveType {
  leave_name: string;
  abbreviation: string;
  gender: string;
  max_no_of_leave: string;
  carry_forward: boolean;
}

const DEFAULT_LEAVE_TYPES: EditableLeaveType[] = [
  {
    leave_name: 'Casual Leave',
    abbreviation: 'CL',
    gender: 'B',
    max_no_of_leave: '6',
    carry_forward: false,
  },
  {
    leave_name: 'Sick Leave',
    abbreviation: 'SL',
    gender: 'B',
    max_no_of_leave: '6',
    carry_forward: false,
  },
  {
    leave_name: 'Paid Leave',
    abbreviation: 'PL',
    gender: 'B',
    max_no_of_leave: '12',
    carry_forward: true,
  },
];

export const LeavePolicyScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [policies, setPolicies] = useState<BackendLeavePolicy[]>([]);
  const [units, setUnits] = useState<BackendUnit[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Create Policy Modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [policyName, setPolicyName] = useState<string>('');
  const [targetUnit, setTargetUnit] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${new Date().getFullYear()}-12-31`);
  const [leaveTypes, setLeaveTypes] = useState<EditableLeaveType[]>(DEFAULT_LEAVE_TYPES);

  // Unit Assign Drawer state
  const [assignModalVisible, setAssignModalVisible] = useState<boolean>(false);
  const [policyToAssign, setPolicyToAssign] = useState<BackendLeavePolicy | null>(null);
  const [assigningUnitCode, setAssigningUnitCode] = useState<string>('');
  const [savingAssignment, setSavingAssignment] = useState<boolean>(false);

  const compCode = currentCompany?.code || currentUser?.companyId || '';

  const loadData = useCallback(async () => {
    try {
      const [policiesRes, unitsRes, assignRes] = await Promise.all([
        superadminApi.getLeavePolicies(),
        superadminApi.getUnits(),
        superadminApi.getLeaveAssignments(),
      ]);

      if (policiesRes.success && policiesRes.data) {
        const list = Array.isArray(policiesRes.data)
          ? policiesRes.data
          : (policiesRes.data as any).results || [];
        setPolicies(list);
      } else {
        setPolicies([]);
      }

      if (unitsRes.success && unitsRes.data) {
        const uList = Array.isArray(unitsRes.data)
          ? unitsRes.data
          : (unitsRes.data as any).results || [];
        setUnits(uList);
      }

      if (assignRes.success && assignRes.data) {
        const aList = Array.isArray(assignRes.data)
          ? assignRes.data
          : (assignRes.data as any).results || [];
        setAssignments(aList);
      }
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Map each policy to assigned unit codes
  const policyUnitMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    assignments.forEach((a: any) => {
      const pName = a.policy_name;
      const uCode = a.unit_code;
      if (pName && uCode) {
        if (!map[pName]) map[pName] = [];
        if (!map[pName].includes(uCode)) {
          map[pName].push(uCode);
        }
      }
    });
    return map;
  }, [assignments]);

  // Filtered policies based on selected unit
  const filteredPolicies = useMemo(() => {
    if (selectedUnitFilter === 'ALL') {
      return policies;
    }
    return policies.filter((p) => {
      const assignedUnits = policyUnitMap[p.policy_name] || [];
      return assignedUnits.includes(selectedUnitFilter) || assignedUnits.length === 0;
    });
  }, [policies, selectedUnitFilter, policyUnitMap]);

  const handleOpenCreateModal = () => {
    setPolicyName(`Workforce Policy ${new Date().getFullYear()}`);
    setTargetUnit(selectedUnitFilter);
    setStartDate(`${new Date().getFullYear()}-01-01`);
    setEndDate(`${new Date().getFullYear()}-12-31`);
    setLeaveTypes([...DEFAULT_LEAVE_TYPES]);
    setModalVisible(true);
  };

  const handleAddCustomLeaveType = () => {
    setLeaveTypes((prev) => [
      ...prev,
      {
        leave_name: 'Custom Leave',
        abbreviation: 'ML',
        gender: 'B',
        max_no_of_leave: '5',
        carry_forward: false,
      },
    ]);
  };

  const handleRemoveLeaveType = (index: number) => {
    if (leaveTypes.length <= 1) {
      showToast({ message: 'Policy must have at least one leave type.', type: 'warning' });
      return;
    }
    setLeaveTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLeaveType = (index: number, field: keyof EditableLeaveType, value: any) => {
    setLeaveTypes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSavePolicy = async (activateImmediately: boolean = false) => {
    if (!policyName.trim()) {
      showToast({ message: 'Please enter a policy name.', type: 'warning' });
      return;
    }
    if (leaveTypes.length === 0) {
      showToast({ message: 'Please add at least one leave type.', type: 'warning' });
      return;
    }

    setCreating(true);
    try {
      const payload = {
        policy_name: policyName.trim(),
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
        leave_types: leaveTypes.map((lt) => ({
          leave_name: lt.leave_name.trim(),
          abbreviation: lt.abbreviation.trim().toUpperCase(),
          gender: lt.gender.trim().toUpperCase() || 'B',
          max_no_of_leave: lt.max_no_of_leave.trim() || '0',
          carry_forward: lt.carry_forward ? '1' : '0',
        })),
        holidays: [],
      };

      const res = await superadminApi.createLeavePolicy(payload);
      if (res.success && res.data) {
        const newPolicyId = res.data.id;
        const pName = res.data.policy_name;

        // If target unit selected, assign policy to that unit
        if (targetUnit !== 'ALL') {
          await superadminApi.assignPolicyToUnits({
            policy_name: pName,
            unit_codes: [targetUnit],
          });
        }

        if (activateImmediately && newPolicyId) {
          const submitRes = await superadminApi.submitLeavePolicy(newPolicyId);
          if (submitRes.success && submitRes.data) {
            showToast({
              message: `Policy Activated! Quotas provisioned for ${submitRes.data.employees_considered || 0} staff.`,
              type: 'success',
            });
          }
        } else {
          showToast({ message: 'Leave policy created successfully.', type: 'success' });
        }

        setModalVisible(false);
        loadData();
      } else {
        const rawErr = (res as any).error;
        const msg =
          rawErr?.data?.policy_name?.[0] ||
          rawErr?.data?.non_field_errors?.[0] ||
          rawErr?.data?.detail ||
          rawErr?.message ||
          'Failed to create leave policy.';
        showToast({ message: String(msg), type: 'error' });
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Error creating policy', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleActivatePolicy = async (policy: BackendLeavePolicy) => {
    setSubmittingId(policy.id);
    try {
      const res = await superadminApi.submitLeavePolicy(policy.id);
      if (res.success && res.data) {
        showToast({
          message: `Activated! Provisioned for ${res.data.employees_considered} staff.`,
          type: 'success',
        });
        loadData();
      } else {
        const err = (res as any).error?.message || 'Failed to activate policy.';
        showToast({ message: err, type: 'error' });
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Network error activating policy', type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleOpenAssignModal = (policy: BackendLeavePolicy) => {
    setPolicyToAssign(policy);
    setAssigningUnitCode(selectedUnitFilter !== 'ALL' ? selectedUnitFilter : units[0]?.unit_code || '');
    setAssignModalVisible(true);
  };

  const handleSaveUnitAssignment = async () => {
    if (!policyToAssign || !assigningUnitCode) {
      showToast({ message: 'Please select a unit.', type: 'warning' });
      return;
    }

    setSavingAssignment(true);
    try {
      const res = await superadminApi.assignPolicyToUnits({
        policy_name: policyToAssign.policy_name,
        unit_codes: [assigningUnitCode],
      });

      if (res.success) {
        showToast({
          message: `Assigned to Unit ${assigningUnitCode}!`,
          type: 'success',
        });
        setAssignModalVisible(false);
        loadData();
      } else {
        showToast({ message: 'Failed to assign policy to unit.', type: 'error' });
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Error assigning policy', type: 'error' });
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeletePolicy = (policy: BackendLeavePolicy) => {
    Alert.alert(
      'Delete Policy',
      `Delete "${policy.policy_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await superadminApi.deleteLeavePolicy(policy.id);
              if (res.success) {
                showToast({ message: 'Policy deleted successfully.', type: 'info' });
                loadData();
              } else {
                showToast({ message: 'Failed to delete policy.', type: 'error' });
              }
            } catch (e: any) {
              showToast({ message: e?.message || 'Error deleting policy', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const renderPolicyCard = ({ item }: { item: BackendLeavePolicy }) => {
    const isSubmitted = Boolean(item.submitted);
    const lTypes = item.leave_types || [];
    const isSubmittingThis = submittingId === item.id;
    const assignedUnits = policyUnitMap[item.policy_name] || [];

    return (
      <View style={styles.policyCard}>
        {/* Header: Title + Status Pill */}
        <View style={styles.policyHeader}>
          <View style={styles.policyTitleWrap}>
            <Text style={styles.policyName} numberOfLines={1}>{item.policy_name}</Text>
            <Text style={styles.policyDates} numberOfLines={1}>
              Validity: {item.start_date || 'Ongoing'} — {item.end_date || 'Annual'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isSubmitted ? styles.statusActive : styles.statusDraft,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isSubmitted ? styles.statusTextActive : styles.statusTextDraft,
              ]}
              numberOfLines={1}
            >
              {isSubmitted ? 'Active' : 'Draft'}
            </Text>
          </View>
        </View>

        {/* Dynamic Unit Scope Pill */}
        <View style={styles.unitScopeRow}>
          <AppIcon name="location" size={11} color="#0F766E" />
          <Text style={styles.unitScopeText} numberOfLines={1}>
            {assignedUnits.length > 0
              ? `Unit: ${assignedUnits.join(', ')}`
              : 'All Units (Company Wide)'}
          </Text>
        </View>

        {/* Configured Day Quotas (Equal 3-Column Grid) */}
        <Text style={styles.quotaSectionTitle}>Day Quotas</Text>
        <View style={styles.leaveTypesGrid}>
          {lTypes.length > 0 ? (
            lTypes.map((lt, idx) => (
              <View key={idx} style={styles.leaveTypePill}>
                <Text style={styles.leaveTypeAbbr} numberOfLines={1}>
                  {lt.abbreviation || lt.leave_name}
                </Text>
                <Text style={styles.leaveTypeDays} numberOfLines={1}>
                  {lt.max_no_of_leave} Days
                </Text>
                <Text style={styles.leaveTypeMeta} numberOfLines={1}>
                  {lt.carry_forward ? 'Carry Fwd' : 'No CF'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.leaveTypeMeta}>No quotas configured.</Text>
          )}
        </View>

        {/* Action Buttons: Delete + Assign Unit + Activate */}
        <View style={styles.cardActionRow}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeletePolicy(item)}
            activeOpacity={0.7}
          >
            <AppIcon name="trash" size={14} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unitAssignBtn}
            onPress={() => handleOpenAssignModal(item)}
            activeOpacity={0.8}
          >
            <AppIcon name="building" size={12} color="#0369A1" />
            <Text style={styles.unitAssignBtnText} numberOfLines={1}>Assign Unit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activateBtn}
            onPress={() => handleActivatePolicy(item)}
            disabled={isSubmittingThis}
            activeOpacity={0.8}
          >
            {isSubmittingThis ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <AppIcon name="refresh-cw" size={12} color="#FFFFFF" />
                <Text style={styles.activateBtnText} numberOfLines={1}>
                  {isSubmitted ? 'Sync Quotas' : 'Activate'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <AppIcon name="calendar" size={28} color="#0284C7" />
        </View>
        <Text style={styles.emptyTitle}>No Leave Policy Configured</Text>
        <Text style={styles.emptySubtitle}>
          {selectedUnitFilter !== 'ALL'
            ? `No leave policy assigned for Unit ${selectedUnitFilter}.`
            : 'Workers have 0 leave balance because no policy is active in MySQL.'}
        </Text>
        <TouchableOpacity
          style={styles.emptyCtaBtn}
          onPress={handleOpenCreateModal}
          activeOpacity={0.85}
        >
          <AppIcon name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.emptyCtaText}>Create Standard Policy</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Leave Policy"
          subtitle="Unit Quotas & Rules"
          onBack={goBack}
          rightComponent={
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleOpenCreateModal}
              activeOpacity={0.8}
            >
              <AppIcon name="plus" size={13} color="#FFFFFF" />
              <Text style={styles.headerActionText}>New Policy</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      {/* Top Banner with Company Code & Policy Count */}
      <View style={styles.topSummaryBanner}>
        <View style={styles.summaryLeft}>
          <View style={styles.companyBadge}>
            <Text style={styles.companyBadgeText}>Company: {compCode || 'Current'}</Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredPolicies.length} Active</Text>
        </View>
      </View>

      {/* Dynamic Unit Selector Filter Chips Bar */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.unitFilterScroll}
        >
          {/* ALL UNITS CHIP */}
          <TouchableOpacity
            style={[
              styles.unitChip,
              selectedUnitFilter === 'ALL' && styles.unitChipActive,
            ]}
            onPress={() => setSelectedUnitFilter('ALL')}
            activeOpacity={0.8}
          >
            <AppIcon
              name="grid"
              size={11}
              color={selectedUnitFilter === 'ALL' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.unitChipText,
                selectedUnitFilter === 'ALL' && styles.unitChipTextActive,
              ]}
            >
              All Units
            </Text>
          </TouchableOpacity>

          {/* DYNAMIC UNIT CHIPS FROM MYSQL */}
          {units.map((u) => {
            const isSelected = selectedUnitFilter === u.unit_code;
            return (
              <TouchableOpacity
                key={u.unit_code}
                style={[styles.unitChip, isSelected && styles.unitChipActive]}
                onPress={() => setSelectedUnitFilter(u.unit_code)}
                activeOpacity={0.8}
              >
                <AppIcon
                  name="location"
                  size={11}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[styles.unitChipText, isSelected && styles.unitChipTextActive]}
                >
                  {u.unit_code} - {u.unit_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Policies List */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      ) : (
        <FlatList
          data={filteredPolicies}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPolicyCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F766E']}
              tintColor="#0F766E"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* CREATE LEAVE POLICY MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: bottomInset + 10 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle} numberOfLines={1}>New Leave Policy</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Set day quotas & provision to unit workforce
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <AppIcon name="x" size={15} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <Text style={styles.fieldLabel}>Policy Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Workforce Policy 2026"
                placeholderTextColor="#94A3B8"
                value={policyName}
                onChangeText={setPolicyName}
              />

              {/* Target Unit Scope Selector Chips */}
              <Text style={styles.fieldLabel}>Target Unit Scope</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalUnitRow}>
                <TouchableOpacity
                  style={[
                    styles.modalUnitChip,
                    targetUnit === 'ALL' && styles.modalUnitChipActive,
                  ]}
                  onPress={() => setTargetUnit('ALL')}
                >
                  <Text
                    style={[
                      styles.modalUnitChipText,
                      targetUnit === 'ALL' && styles.modalUnitChipTextActive,
                    ]}
                  >
                    All Units (Company Wide)
                  </Text>
                </TouchableOpacity>

                {units.map((u) => {
                  const isSel = targetUnit === u.unit_code;
                  return (
                    <TouchableOpacity
                      key={u.unit_code}
                      style={[styles.modalUnitChip, isSel && styles.modalUnitChipActive]}
                      onPress={() => setTargetUnit(u.unit_code)}
                    >
                      <Text
                        style={[
                          styles.modalUnitChipText,
                          isSel && styles.modalUnitChipTextActive,
                        ]}
                      >
                        {u.unit_code} - {u.unit_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.fieldLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              <View style={styles.sectionDivider}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Leave Types & Day Quotas</Text>
                  <TouchableOpacity
                    style={styles.addTypeBtn}
                    onPress={handleAddCustomLeaveType}
                  >
                    <AppIcon name="plus" size={11} color="#0369A1" />
                    <Text style={styles.addTypeText}>Add Type</Text>
                  </TouchableOpacity>
                </View>

                {leaveTypes.map((lt, idx) => (
                  <View key={idx} style={styles.leaveTypeRow}>
                    <View style={styles.leaveTypeRowHeader}>
                      <Text style={styles.leaveTypeRowTitle}>
                        {lt.leave_name} ({lt.abbreviation})
                      </Text>
                      {leaveTypes.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeTypeBtn}
                          onPress={() => handleRemoveLeaveType(idx)}
                        >
                          <AppIcon name="trash" size={13} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.typeInputsRow}>
                      <View style={[styles.typeInputWrap, { flex: 1 }]}>
                        <Text style={styles.typeInputLabel}>Code</Text>
                        <TextInput
                          style={styles.typeInput}
                          value={lt.abbreviation}
                          onChangeText={(v) => handleUpdateLeaveType(idx, 'abbreviation', v)}
                          maxLength={6}
                        />
                      </View>
                      <View style={[styles.typeInputWrap, { flex: 1.3 }]}>
                        <Text style={styles.typeInputLabel}>Days Allowed</Text>
                        <TextInput
                          style={styles.typeInput}
                          value={lt.max_no_of_leave}
                          keyboardType="numeric"
                          onChangeText={(v) => handleUpdateLeaveType(idx, 'max_no_of_leave', v)}
                        />
                      </View>
                      <View style={[styles.typeInputWrap, { flex: 1.1 }]}>
                        <Text style={styles.typeInputLabel}>Carry Fwd</Text>
                        <TouchableOpacity
                          style={[
                            styles.toggleCfBtn,
                            lt.carry_forward && styles.toggleCfBtnActive,
                          ]}
                          onPress={() =>
                            handleUpdateLeaveType(idx, 'carry_forward', !lt.carry_forward)
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.toggleCfText,
                              lt.carry_forward && styles.toggleCfTextActive,
                            ]}
                          >
                            {lt.carry_forward ? 'YES' : 'NO'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* ACTION BUTTONS DIRECTLY INSIDE SCROLLVIEW - 100% VISIBLE & NEVER CUT OFF */}
              <View style={styles.footerButtonRow}>
                <TouchableOpacity
                  style={styles.draftBtn}
                  onPress={() => handleSavePolicy(false)}
                  disabled={creating}
                  activeOpacity={0.8}
                >
                  <Text style={styles.draftBtnText} numberOfLines={1}>Save as Draft</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => handleSavePolicy(true)}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText} numberOfLines={1}>
                      Save & Activate 🚀
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ASSIGN POLICY TO UNIT MODAL */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '75%', minHeight: '45%', paddingBottom: bottomInset + 10 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle} numberOfLines={1}>Assign Policy to Unit</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Policy: {policyToAssign?.policy_name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAssignModalVisible(false)}
              >
                <AppIcon name="x" size={15} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>Select Unit to Apply This Policy:</Text>
              {units.map((u) => {
                const isSelected = assigningUnitCode === u.unit_code;
                return (
                  <TouchableOpacity
                    key={u.unit_code}
                    style={[
                      styles.leaveTypeRow,
                      isSelected && { borderColor: '#0F766E', backgroundColor: '#F0FDFA' },
                    ]}
                    onPress={() => setAssigningUnitCode(u.unit_code)}
                  >
                    <View style={styles.leaveTypeRowHeader}>
                      <Text
                        style={[
                          styles.leaveTypeRowTitle,
                          isSelected && { color: '#0F766E', fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        Unit: {u.unit_code} — {u.unit_name}
                      </Text>
                      {isSelected && (
                        <AppIcon name="check" size={15} color="#0F766E" />
                      )}
                    </View>
                    <Text style={styles.leaveTypeMeta} numberOfLines={1}>
                      City: {u.unit_city || 'N/A'} • {u.unit_add1 || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <View style={{ marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveUnitAssignment}
                  disabled={savingAssignment}
                  activeOpacity={0.85}
                >
                  {savingAssignment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText} numberOfLines={1}>
                      Confirm Assignment to Unit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppScreenContainer>
  );
};
