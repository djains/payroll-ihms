import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './UserManagementScreen.styles';
import {
  AppScreenContainer,
  AppIcon,
  AppTextInput,
  AppButton,
  CustomAlertModal,
  PasswordStrengthMeter,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi, BackendUserItem } from '../../../api';
import { colors } from '../../../theme';

// Module-level in-memory cache
let cachedUsers: BackendUserItem[] | null = null;

export const UserManagementScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [users, setUsers] = useState<BackendUserItem[]>(cachedUsers || []);
  const [loading, setLoading] = useState<boolean>(!cachedUsers);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Custom alert modal
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
  }>({
    visible: false,
    title: '',
  });

  // Admin Direct Password Reset States
  const [selectedUserForReset, setSelectedUserForReset] = useState<BackendUserItem | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleAdminResetPassword = async () => {
    if (!selectedUserForReset) return;
    const cleanNew = newAdminPassword.trim();
    const cleanConfirm = confirmAdminPassword.trim();

    if (!cleanNew) {
      setResetError('Please enter a new password.');
      return;
    }

    if (cleanNew.length < 9) {
      setResetError('Password must be at least 9 characters (e.g. Staff@1234).');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const res = await superadminApi.updateUser(selectedUserForReset.id, {
        password: cleanNew,
        confirm_password: cleanConfirm,
        role_name: selectedUserForReset.current_role || undefined,
      });
      setResetLoading(false);

      if (res.success) {
        const userObj = selectedUserForReset;
        setSelectedUserForReset(null);
        setNewAdminPassword('');
        setConfirmAdminPassword('');
        setAlertConfig({
          visible: true,
          title: 'Password Reset Successful',
          message: `Password has been reset for ${userObj.username}. The employee can now log in with the new password.`,
          type: 'success',
        });
      } else {
        const err = res.error || (res.data as any)?.detail || 'Failed to reset password';
        setResetError(typeof err === 'string' ? err : JSON.stringify(err));
      }
    } catch (err: any) {
      setResetLoading(false);
      setResetError(err?.message || 'Network error while resetting password.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await superadminApi.getUsers();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        cachedUsers = list;
        setUsers(list);
      }
    } catch (e) {
      console.warn('[UserManagement] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const toggleUserActiveStatus = async (user: BackendUserItem) => {
    setActionLoadingId(user.id);
    const newStatus = !user.is_active;

    try {
      const res = await superadminApi.updateUser(user.id, { is_active: newStatus });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
        );
        setAlertConfig({
          visible: true,
          title: 'Status Updated',
          message: `User ${user.username} is now ${newStatus ? 'Active' : 'Blocked'}.`,
          type: 'success',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Update Failed',
          message: 'Could not change user status in MySQL.',
          type: 'danger',
        });
      }
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: err?.message || 'Network error while updating user.',
        type: 'danger',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.login_name && u.login_name.toLowerCase().includes(q)) ||
      (u.current_role && u.current_role.toLowerCase().includes(q))
    );
  });

  const renderUserItem = ({ item }: { item: BackendUserItem }) => {
    const isBusy = actionLoadingId === item.id;
    const initial = (item.username || 'U').charAt(0).toUpperCase();

    return (
      <View style={styles.userCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.userInfoLeft}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.usernameText} numberOfLines={1}>
                {item.username}
              </Text>
              <Text style={styles.loginNameText} numberOfLines={1}>
                {item.login_name || item.legacy_login_id}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <AppIcon
              name={item.is_active ? 'check-circle' : 'close'}
              size={10}
              color={item.is_active ? '#059669' : '#DC2626'}
            />
            <Text
              style={item.is_active ? styles.statusTextActive : styles.statusTextInactive}
            >
              {item.is_active ? 'Active' : 'Blocked'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              Role: {item.current_role || 'Not Assigned'}
            </Text>
          </View>

          <View style={styles.cardActionsRight}>
            <TouchableOpacity
              style={styles.resetPwButton}
              onPress={() => {
                setSelectedUserForReset(item);
                setNewAdminPassword('');
                setConfirmAdminPassword('');
                setResetError(null);
              }}
              activeOpacity={0.7}
            >
              <AppIcon name="lock" size={11} color="#4F46E5" />
              <Text style={styles.resetPwBtnText}>Reset Pw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                item.is_active ? styles.toggleBtnDeactivate : styles.toggleBtnActivate,
              ]}
              onPress={() => toggleUserActiveStatus(item)}
              disabled={isBusy}
              activeOpacity={0.7}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#475569" />
              ) : (
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: item.is_active ? '#DC2626' : '#059669' },
                  ]}
                >
                  {item.is_active ? 'Block User' : 'Activate User'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor={colors.background}
    >
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <AppIcon name="chevronLeft" size={18} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>
              Live MySQL Authentication Directory
            </Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBoxWrap}>
        <AppTextInput
          placeholder="Search by username, login name, or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconLeft="search"
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          Total Users: {users.length} • Showing: {filteredUsers.length}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Fetching live users from backend...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <AppIcon name="person" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No users matched your query.</Text>
            </View>
          }
        />
      )}

      {/* Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type || 'info'}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[
          {
            text: 'OK',
            onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
          },
        ]}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* Admin Reset Password Modal */}
      <Modal
        visible={!!selectedUserForReset}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!resetLoading) setSelectedUserForReset(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!resetLoading) setSelectedUserForReset(null);
          }}
        >
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#EEF2FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="lock" size={18} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Reset User Password</Text>
                    <Text style={styles.modalSubtitle}>
                      Target ID: {selectedUserForReset?.username}
                    </Text>
                  </View>
                </View>

                {resetError && <Text style={styles.modalErrorText}>{resetError}</Text>}

                <View style={{ gap: 12 }}>
                  <AppTextInput
                    label="New Password"
                    placeholder="Min 9 chars (e.g. Staff@1234)"
                    value={newAdminPassword}
                    onChangeText={(t) => {
                      setNewAdminPassword(t);
                      if (resetError) setResetError(null);
                    }}
                    isPassword
                    iconLeft="lock"
                    helperText="Must be >= 9 characters"
                  />
                  <PasswordStrengthMeter password={newAdminPassword} minChars={9} />

                  <AppTextInput
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmAdminPassword}
                    onChangeText={(t) => {
                      setConfirmAdminPassword(t);
                      if (resetError) setResetError(null);
                    }}
                    isPassword
                    iconLeft="lock"
                  />
                </View>

                <View style={styles.modalActions}>
                  <AppButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setSelectedUserForReset(null)}
                    disabled={resetLoading}
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    title={resetLoading ? 'Resetting...' : 'Reset Password'}
                    variant="primary"
                    onPress={handleAdminResetPassword}
                    loading={resetLoading}
                    disabled={resetLoading}
                    style={{ flex: 2 }}
                    customColor="#4F46E5"
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AppScreenContainer>
  );
};

