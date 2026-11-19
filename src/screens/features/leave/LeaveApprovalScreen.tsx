import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { styles } from './LeaveApprovalScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
  CustomAlertModal,
  CustomAlertButton,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { staffApi } from '../../../api';
import { showToast } from '../../../store/toastStore';

interface LeaveApplicationItem {
  leave_id: number;
  comp_code?: string;
  emp_code: string;
  emp_name?: string;
  leave_type: string;
  leave_reason?: string;
  from_date: string;
  to_date: string;
  no_of_days: string | number;
  max_no_of_leave?: string;
  leave_status: string; // 'Pending' | 'Approved' | 'Rejected'
  status_comment?: string;
  leave_apply_date?: string;
  leave_approved_date?: string;
  reporing_to?: string;
  manager?: string;
}

export const LeaveApprovalScreen: React.FC = () => {
  const { goBack } = useNavigation();

  const [applications, setApplications] = useState<LeaveApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  // Action states
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // Custom Global Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
    buttons?: CustomAlertButton[];
  }>({
    visible: false,
    title: '',
  });

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [rejectingItem, setRejectingItem] = useState<LeaveApplicationItem | null>(null);
  const [rejectComment, setRejectComment] = useState<string>('');

  const fetchLeaveRequests = async () => {
    try {
      const res = await staffApi.getManageLeaveApplications();
      if (res.success && res.data) {
        const raw = res.data;
        const list: LeaveApplicationItem[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.results)
          ? raw.results
          : [];
        setApplications(list);
      } else {
        setApplications([]);
      }
    } catch (e: any) {
      console.warn('[LeaveApprovalScreen] Fetch error:', e);
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not load leave requests from backend.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveRequests();
  };

  const handleApprove = (item: LeaveApplicationItem) => {
    setAlertConfig({
      visible: true,
      title: 'Approve Leave Request ✅',
      message: `Approve ${item.no_of_days} day(s) ${item.leave_type} leave for ${item.emp_name || item.emp_code}?\n\nThis will automatically deduct ${item.no_of_days} day(s) from their leave balance.`,
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: 'Approve ✅',
          style: 'default',
          onPress: async () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            setActionInProgressId(item.leave_id);
            try {
              const res = await staffApi.approveLeaveApplication(item.leave_id);
              if (res.success) {
                setAlertConfig({
                  visible: true,
                  title: 'Leave Approved ✅',
                  message: `Leave request for ${item.emp_name || item.emp_code} has been approved successfully.`,
                  type: 'success',
                  buttons: [
                    {
                      text: 'OK',
                      onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                    },
                  ],
                });
                fetchLeaveRequests();
              } else {
                setAlertConfig({
                  visible: true,
                  title: 'Approval Failed',
                  message: res.error || 'Could not approve leave.',
                  type: 'danger',
                  buttons: [
                    {
                      text: 'OK',
                      onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                    },
                  ],
                });
              }
            } catch (err: any) {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: err?.message || 'Server error occurred during approval.',
                type: 'danger',
                buttons: [
                  {
                    text: 'OK',
                    onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                  },
                ],
              });
            } finally {
              setActionInProgressId(null);
            }
          },
        },
      ],
    });
  };

  const handleOpenRejectModal = (item: LeaveApplicationItem) => {
    setRejectingItem(item);
    setRejectComment('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectComment.trim()) {
      showToast({
        type: 'warning',
        title: 'Comment Required',
        message: 'Please enter a reason or next availability for rejection.',
      });
      return;
    }

    const leaveId = rejectingItem.leave_id;
    setActionInProgressId(leaveId);
    setRejectModalVisible(false);

    try {
      const res = await staffApi.rejectLeaveApplication(leaveId, rejectComment.trim());
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Leave Rejected',
          message: `Leave request has been rejected.`,
        });
        fetchLeaveRequests();
      } else {
        showToast({
          type: 'error',
          title: 'Rejection Failed',
          message: res.error || 'Could not reject leave.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Server error occurred during rejection.',
      });
    } finally {
      setActionInProgressId(null);
      setRejectingItem(null);
    }
  };

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    applications.forEach((app) => {
      const st = (app.leave_status || '').toLowerCase();
      if (st === 'approved') approved++;
      else if (st === 'rejected') rejected++;
      else pending++;
    });
    return {
      pending,
      approved,
      rejected,
      all: applications.length,
    };
  }, [applications]);

  // Filtered List
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const st = (app.leave_status || '').toLowerCase();
      let matchTab = true;
      if (activeTab === 'PENDING') {
        matchTab = st !== 'approved' && st !== 'rejected';
      } else if (activeTab === 'APPROVED') {
        matchTab = st === 'approved';
      } else if (activeTab === 'REJECTED') {
        matchTab = st === 'rejected';
      }

      if (!matchTab) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        (app.emp_name && app.emp_name.toLowerCase().includes(q)) ||
        (app.emp_code && app.emp_code.toLowerCase().includes(q)) ||
        (app.leave_type && app.leave_type.toLowerCase().includes(q)) ||
        (app.leave_reason && app.leave_reason.toLowerCase().includes(q))
      );
    });
  }, [applications, activeTab, searchQuery]);

  const renderLeaveCard = ({ item }: { item: LeaveApplicationItem }) => {
    const isPending = (item.leave_status || '').toLowerCase() === 'pending';
    const isApproved = (item.leave_status || '').toLowerCase() === 'approved';
    const isRejected = (item.leave_status || '').toLowerCase() === 'rejected';
    const initial = (item.emp_name || item.emp_code || 'W').charAt(0).toUpperCase();
    const isBusy = actionInProgressId === item.leave_id;

    return (
      <View style={styles.leaveCard}>
        {/* Top Header */}
        <View style={styles.cardTopRow}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>{initial}</Text>
          </View>
          <View style={styles.workerMeta}>
            <Text style={styles.workerName}>{item.emp_name || 'Worker'}</Text>
            <Text style={styles.workerSubText}>
              ID: {item.emp_code} • Type: {item.leave_type}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isApproved
                ? styles.statusBadgeApproved
                : isRejected
                ? styles.statusBadgeRejected
                : styles.statusBadgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isApproved
                  ? styles.statusTextApproved
                  : isRejected
                  ? styles.statusTextRejected
                  : styles.statusTextPending,
              ]}
            >
              {item.leave_status || 'Pending'}
            </Text>
          </View>
        </View>

        {/* Details Box */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailVal}>
              {item.from_date} ➔ {item.to_date}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested Days</Text>
            <Text style={styles.detailVal}>{item.no_of_days} Day(s)</Text>
          </View>
          {item.leave_apply_date ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Applied On</Text>
              <Text style={styles.detailVal}>
                {String(item.leave_apply_date).split('T')[0]}
              </Text>
            </View>
          ) : null}

          {/* Reason */}
          {item.leave_reason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason for Leave:</Text>
              <Text style={styles.reasonText}>"{item.leave_reason}"</Text>
            </View>
          ) : null}

          {/* Rejection comment if rejected */}
          {isRejected && item.status_comment ? (
            <Text style={styles.statusCommentText}>
              Supervisor Comment: {item.status_comment}
            </Text>
          ) : null}
        </View>

        {/* Pending Action Buttons */}
        {isPending ? (
          <View style={styles.actionsRow}>
            {isBusy ? (
              <ActivityIndicator size="small" color="#0F766E" style={{ flex: 1, paddingVertical: 8 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="check" size={15} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleOpenRejectModal(item)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="close" size={15} color="#DC2626" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Leave Approvals"
          subtitle="Review Unit Leave Applications"
          onBack={goBack}
        />
      }
    >
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrap}>
          <AppIcon name="search" size={16} color="#64748B" />
          <TextInput
            placeholder="Search by worker name, ID, type or reason..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <AppIcon name="close" size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'PENDING' && styles.tabChipActive]}
            onPress={() => setActiveTab('PENDING')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabChipText, activeTab === 'PENDING' && styles.tabChipTextActive]}>
              Pending
            </Text>
            <View style={[styles.tabBadge, activeTab === 'PENDING' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'PENDING' && styles.tabBadgeTextActive]}>
                {tabCounts.pending}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'APPROVED' && styles.tabChipActive]}
            onPress={() => setActiveTab('APPROVED')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabChipText, activeTab === 'APPROVED' && styles.tabChipTextActive]}>
              Approved
            </Text>
            <View style={[styles.tabBadge, activeTab === 'APPROVED' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'APPROVED' && styles.tabBadgeTextActive]}>
                {tabCounts.approved}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'REJECTED' && styles.tabChipActive]}
            onPress={() => setActiveTab('REJECTED')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabChipText, activeTab === 'REJECTED' && styles.tabChipTextActive]}>
              Rejected
            </Text>
            <View style={[styles.tabBadge, activeTab === 'REJECTED' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'REJECTED' && styles.tabBadgeTextActive]}>
                {tabCounts.rejected}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'ALL' && styles.tabChipActive]}
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabChipText, activeTab === 'ALL' && styles.tabChipTextActive]}>
              All
            </Text>
            <View style={[styles.tabBadge, activeTab === 'ALL' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'ALL' && styles.tabBadgeTextActive]}>
                {tabCounts.all}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.emptySubtitle}>Loading unit leave requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => String(item.leave_id)}
          renderItem={renderLeaveCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppIcon name="calendar" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'PENDING'
                  ? 'No Pending Requests'
                  : `No ${activeTab.toLowerCase()} requests`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'PENDING'
                  ? 'Great job! All leave applications from your unit have been reviewed.'
                  : 'There are no leave applications matching this filter.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
            <Text style={styles.modalSubtitle}>
              Please provide the reason for rejecting {rejectingItem?.emp_name || rejectingItem?.emp_code}'s leave request.
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="e.g. Critical deployment on site, please re-apply next week."
              placeholderTextColor="#94A3B8"
              value={rejectComment}
              onChangeText={setRejectComment}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmRejectBtn}
                onPress={handleConfirmReject}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmRejectText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Global Custom Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type || 'info'}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </AppScreenContainer>
  );
};

