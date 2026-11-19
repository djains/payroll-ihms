import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './RolePermissionsScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi } from '../../../api';
import { showToast } from '../../../store/toastStore';

interface RoleItem {
  id: number;
  name: string;
  permissions?: Array<{ menu_id: number; permission: string }>;
}

interface FeatureModuleConfig {
  id: string;
  name: string;
  icon: string;
  menuIds: number[];
  syncMenuIds?: number[];
  menuName: string;
  category: string;
}

const PERM_RANK: Record<string, number> = { I: 0, R: 1, U: 2, C: 3, D: 4 };

const MODULE_FEATURES: FeatureModuleConfig[] = [
  { id: 'attendance', name: 'Shift Attendance & Punch', icon: 'fingerprint', menuIds: [54, 48], menuName: 'Attendance Sheet', category: 'Core Operations' },
  { id: 'leave_apply', name: 'Leave Application (Apply Leave)', icon: 'clock', menuIds: [14], menuName: 'Leave Apply', category: 'Core Operations' },
  { id: 'leave_approval', name: 'Unit Leave Approvals (Leave List)', icon: 'check-circle', menuIds: [22, 100], menuName: 'Leave Request', category: 'Supervisor & Quality' },
  { id: 'salary', name: 'Salary Slip & Compensation', icon: 'document', menuIds: [90, 28], menuName: 'Staff Salary Details', category: 'Payroll & HR' },
  // kyc grants Employee Master (6) + Android Document (70) so worker can upload their own docs; sync strictly on Menu 6 so Document Verify stays separate
  { id: 'kyc', name: 'Aadhaar / PAN KYC Dossier & Documents', icon: 'shield', menuIds: [6, 70], syncMenuIds: [6], menuName: 'Employee Master', category: 'Payroll & HR' },
  { id: 'work_proof', name: 'Working Proof Photos', icon: 'camera', menuIds: [122], menuName: 'Branchwise image upload', category: 'Field Operations' },
  { id: 'site_audit', name: '6-Point Site Audit', icon: 'audit', menuIds: [73], menuName: 'Site Audit', category: 'Supervisor & Quality' },
  { id: 'chemicals', name: 'Housekeeping Materials / Stock', icon: 'flask', menuIds: [65], menuName: 'Item Master', category: 'Field Operations' },
  { id: 'petty_cash', name: 'Petty Cash Claims', icon: 'cash', menuIds: [135], menuName: 'Petty Cash Android', category: 'Finance & Claims' },
  { id: 'travel', name: 'Conveyance & Travel Expense', icon: 'car', menuIds: [37], menuName: 'Travel Expense', category: 'Finance & Claims' },
  { id: 'recruitment', name: 'Spot Recruitment / Hiring', icon: 'person', menuIds: [75], menuName: 'Employee Recruitment', category: 'Field Operations' },
  // doc_verify gates the Document Verify card on Menu 145 ('Document Verify') + grants Menu 70 for backend review PATCH
  { id: 'doc_verify', name: 'Document Verify (KYC Review & Approve)', icon: 'shield', menuIds: [145, 70], syncMenuIds: [145], menuName: 'Document Verify', category: 'Payroll & HR' },
];

export const RolePermissionsScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shiftReadMenuIds, setShiftReadMenuIds] = useState<number[]>([42, 43]);
  const [moduleFeatures, setModuleFeatures] = useState(MODULE_FEATURES);
  // name -> id map built from live menu tree (used at save time)
  const menuNameToIdRef = useRef<Record<string, number>>({});

  // Matrix: { [moduleId]: { r: boolean, c: boolean, u: boolean, d: boolean } }
  const [permissionsMatrix, setPermissionsMatrix] = useState<
    Record<string, { r: boolean; c: boolean; u: boolean; d: boolean }>
  >({});


  // Calculate enabled count
  const enabledCount = useMemo(() => {
    let count = 0;
    moduleFeatures.forEach((m) => {
      const p = permissionsMatrix[m.id];
      if (p && (p.r || p.c || p.u || p.d)) {
        count += 1;
      }
    });
    return count;
  }, [permissionsMatrix, moduleFeatures]);

  // Apply matrix for a given role directly from its database permissions
  const syncMatrixForRole = (roleItem?: RoleItem) => {
    if (!roleItem) return;

    const initMat: Record<string, { r: boolean; c: boolean; u: boolean; d: boolean }> = {};
    const rolePermMap = new Map<number, string>();
    if (roleItem.permissions && Array.isArray(roleItem.permissions)) {
      roleItem.permissions.forEach((p: any) => {
        const mId = p.menu_id || p.menu?.id;
        const permVal = String(p.permission || '').toUpperCase();
        const isInFeatures = moduleFeatures.some(
          (mod) => (mod.syncMenuIds || mod.menuIds).includes(mId)
        );
        if (mId && permVal && permVal !== 'I' && (permVal !== 'D' || isInFeatures)) {
          rolePermMap.set(mId, permVal);
        }
      });
    }

    moduleFeatures.forEach((m) => {
      let maxLvl = '';
      const targetIds = m.syncMenuIds || m.menuIds;
      targetIds.forEach((id) => {
        const l = rolePermMap.get(id);
        if (l && (PERM_RANK[l] || 0) >= (PERM_RANK[maxLvl] || 0)) {
          maxLvl = l;
        }
      });
      initMat[m.id] = {
        r: maxLvl === 'R' || maxLvl === 'U' || maxLvl === 'C' || maxLvl === 'D',
        u: maxLvl === 'U' || maxLvl === 'C' || maxLvl === 'D', // In backend RBAC, C (Level 3) includes Update + View
        c: maxLvl === 'C' || maxLvl === 'D',
        d: maxLvl === 'D',
      };
    });

    setPermissionsMatrix(initMat);
  };

  useEffect(() => {
    // Dynamically resolve Shift Calendar, Shift Creation, & Document Verify IDs if available
    superadminApi.getMenuTree().then((mRes) => {
      if (mRes.success && mRes.data) {
        const items: any[] = Array.isArray(mRes.data) ? mRes.data : mRes.data.results || [];
        const shiftIds: number[] = [];
        let docVerifyId: number | null = null;
        const walk = (nodes: any[]) => {
          nodes.forEach((n) => {
            const nm = String(n.name || n.menu || '').trim().toLowerCase();
            const idVal = Number(n.id);
            if (idVal && n.name) {
              menuNameToIdRef.current[nm] = idVal;
            }
            if (nm === 'shift calendar' || nm === 'shift creation') {
              if (idVal && !shiftIds.includes(idVal)) shiftIds.push(idVal);
            }
            if (nm === 'document verify') {
              if (idVal) docVerifyId = idVal;
            }
            if (Array.isArray(n.children)) walk(n.children);
          });
        };
        walk(items);
        if (shiftIds.length > 0) setShiftReadMenuIds(shiftIds);
        if (docVerifyId) {
          setModuleFeatures(prev =>
            prev.map(m => m.id === 'doc_verify'
              ? { ...m, menuIds: [docVerifyId as number, 70], syncMenuIds: [docVerifyId as number] }
              : m)
          );
        }
      }
    }).catch(() => {});

    superadminApi.getRoles().then((res) => {
      if (res.success && res.data) {
        const list: any[] = Array.isArray(res.data)
          ? res.data
          : (res.data as any).results || [];

        const employeeRoles = list.filter((r) => {
          const n = (r.name || '').toLowerCase();
          return !n.startsWith('company admin') && n !== 'admin' && n !== 'superadmin';
        });

        setRoles(employeeRoles);
        if (employeeRoles.length > 0) {
          setSelectedRoleId(employeeRoles[0].id);
          syncMatrixForRole(employeeRoles[0]);
        }
      }
      setLoadingRoles(false);
    }).catch(() => setLoadingRoles(false));
  }, []);

  const handleSelectRole = (role: RoleItem) => {
    setSelectedRoleId(role.id);
    syncMatrixForRole(role);
  };

  const togglePermission = (moduleId: string, action: 'r' | 'c' | 'u' | 'd') => {
    setPermissionsMatrix((prev) => {
      const current = prev[moduleId] || { r: false, c: false, u: false, d: false };
      const next = { ...current };

      if (action === 'd') {
        const turnOn = !current.d;
        next.d = turnOn;
        if (turnOn) {
          next.c = true;
          next.u = true;
          next.r = true;
        }
      } else if (action === 'c') {
        const turnOn = !current.c;
        next.c = turnOn;
        if (turnOn) {
          next.u = true;
          next.r = true;
        } else {
          next.d = false; // Cannot have Delete without Create
        }
      } else if (action === 'u') {
        const turnOn = !current.u;
        next.u = turnOn;
        if (turnOn) {
          next.r = true;
        } else {
          // Disabling Update also disables Create & Delete because in backend RBAC,
          // Level C (Create) and Level D (Delete) inherently grant Update permission.
          next.c = false;
          next.d = false;
        }
      } else if (action === 'r') {
        const turnOn = !current.r;
        next.r = turnOn;
        if (!turnOn) {
          // Disabling Read turns off all permissions
          next.u = false;
          next.c = false;
          next.d = false;
        }
      }

      return {
        ...prev,
        [moduleId]: next,
      };
    });
  };

  // Quick Presets
  const applyPreset = (preset: 'standard' | 'view_only' | 'clear') => {
    const newMat: Record<string, { r: boolean; c: boolean; u: boolean; d: boolean }> = {};
    moduleFeatures.forEach((m) => {
      if (preset === 'standard') {
        newMat[m.id] = { r: true, c: true, u: true, d: false };
      } else if (preset === 'view_only') {
        newMat[m.id] = { r: true, c: false, u: false, d: false };
      } else {
        newMat[m.id] = { r: false, c: false, u: false, d: false };
      }
    });
    setPermissionsMatrix(newMat);
    showToast({
      type: 'info',
      title: 'Preset Applied',
      message:
        preset === 'standard'
          ? 'Read, Create & Update enabled for all features.'
          : preset === 'view_only'
            ? 'Read-only access set for all features.'
            : 'All permissions cleared.',
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    const selectedRole = roles.find((r) => r.id === selectedRoleId);
    if (!selectedRole) return;

    // Convert matrix state into deduplicated backend menu permissions (highest rank wins per menu_id)
    const permByMenuId = new Map<number, string>();
    const addPerm = (mId: number, lvl: string) => {
      if (mId <= 0 || !lvl) return;
      const prev = permByMenuId.get(mId);
      if (!prev || (PERM_RANK[lvl] || 0) > (PERM_RANK[prev] || 0)) {
        permByMenuId.set(mId, lvl);
      }
    };

    moduleFeatures.forEach((mod) => {
      const p = permissionsMatrix[mod.id];
      if (!p) return;
      let permLevel = '';
      if (p.d) permLevel = 'D';
      else if (p.c) permLevel = 'C';
      else if (p.u) permLevel = 'U';
      else if (p.r) permLevel = 'R';

      if (permLevel) {
        mod.menuIds.forEach((mId) => addPerm(mId, permLevel));
        // Grant Read-only ('R') on Shift Calendar & Shift Creation when Shift Attendance & Punch is enabled
        if (mod.id === 'attendance') {
          shiftReadMenuIds.forEach((sId) => addPerm(sId, 'R'));
        }
      }
    });

    const permissionsPayload: Array<{ menu_id: number; permission: string }> = Array.from(
      permByMenuId.entries()
    ).map(([menu_id, permission]) => ({ menu_id, permission }));

    try {
      // Live patch to backend database
      const res = await superadminApi.updateRolePermissions(selectedRoleId, {
        name: selectedRole.name,
        permissions: permissionsPayload,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Saved!',
          message: `${selectedRole.name} permissions updated successfully in database.`,
        });

        // Re-fetch fresh live roles directly from the database
        try {
          const freshRes = await superadminApi.getRoles();
          if (freshRes.success && freshRes.data) {
            const list: any[] = Array.isArray(freshRes.data)
              ? freshRes.data
              : (freshRes.data as any).results || [];

            const employeeRoles = list.filter((r) => {
              const n = (r.name || '').toLowerCase();
              return !n.startsWith('company admin') && n !== 'admin' && n !== 'superadmin';
            });

            setRoles(employeeRoles);
            const updatedRole = employeeRoles.find((r) => r.id === selectedRoleId);
            if (updatedRole) {
              syncMatrixForRole(updatedRole);
            }
          }
        } catch (_) {
          // If immediate refetch has latency, keep state updated with saved permissions
          setRoles((prev) =>
            prev.map((r) =>
              r.id === selectedRoleId
                ? { ...r, permissions: permissionsPayload }
                : r
            )
          );
        }
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: res.error || 'Failed to update permissions.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: e?.message || 'Failed to connect to backend.',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedRoleName = roles.find((r) => r.id === selectedRoleId)?.name || 'Workforce Role';

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Role RBAC"
          subtitle="Configure Staff Feature Access"
          onBack={goBack}
          rightComponent={
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSavePermissions}
              disabled={saving}
            >
              <AppIcon name="save" size={14} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Matrix'}</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentWrap, { paddingBottom: bottomInset + 40 }]}
      >
        {/* Role Horizontal Selector Card */}
        <View style={styles.roleSelectorCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}><AppIcon name="users" size={15} color="#0F766E" /><Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Select Workforce Role</Text></View>

          {loadingRoles ? (
            <ActivityIndicator size="small" color="#0F766E" style={{ paddingVertical: 10 }} />
          ) : roles.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#EF4444', fontStyle: 'italic', paddingVertical: 4 }}>
              No employee roles found. Please create a role in Create Role first.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
              {roles.map((r) => {
                const isSel = selectedRoleId === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleChip, isSel && styles.roleChipActive]}
                    onPress={() => handleSelectRole(r)}
                    activeOpacity={0.75}
                  >
                    <AppIcon
                      name="user"
                      size={13}
                      color={isSel ? '#FFFFFF' : '#0F766E'}
                    />
                    <Text style={[styles.roleChipText, isSel && styles.roleChipTextActive]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Responsive Stats & Presets Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statsBadge}>
              <AppIcon name="id-card" size={12} color="#0F766E" />
              <Text style={styles.statsBadgeText}>
                {enabledCount} / {moduleFeatures.length} Active
              </Text>
            </View>
            <Text style={styles.roleLabelText} numberOfLines={1}>
              Role: <Text style={{ color: '#0F766E', fontWeight: '800' }}>{selectedRoleName}</Text>
            </Text>
          </View>

          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => applyPreset('standard')}
              activeOpacity={0.75}
            >
              <Text style={styles.presetBtnText}>Standard (R+C)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => applyPreset('view_only')}
              activeOpacity={0.75}
            >
              <Text style={styles.presetBtnText}>View Only (R)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => applyPreset('clear')}
              activeOpacity={0.75}
            >
              <Text style={[styles.presetBtnText, { color: '#EF4444' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Header with Legend */}
        <View style={styles.matrixHeader}>
          <Text style={styles.matrixHeaderTitle}>Features Matrix</Text>
          <View style={styles.matrixLegendRow}>
            <Text style={[styles.legendItem, { color: '#2563EB' }]}>R:Read</Text>
            <Text style={[styles.legendItem, { color: '#059669' }]}>C:Create</Text>
            <Text style={[styles.legendItem, { color: '#D97706' }]}>U:Update</Text>
            <Text style={[styles.legendItem, { color: '#DC2626' }]}>D:Delete</Text>
          </View>
        </View>

        {/* Feature Permissions Matrix Cards */}
        {moduleFeatures.map((mod) => {
          const perms = permissionsMatrix[mod.id] || {
            r: false,
            c: false,
            u: false,
            d: false,
          };

          return (
            <View key={mod.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIconWrap}>
                  <AppIcon name={mod.icon as any} size={16} color="#0F766E" />
                </View>
                <View style={styles.moduleTitleWrap}>
                  <Text style={styles.moduleName} numberOfLines={1} ellipsizeMode="tail">
                    {mod.name}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.moduleCategory}>{mod.category}</Text>
                  </View>
                </View>
              </View>

              {/* 4-Column High-Contrast Responsive CRUD Pills */}
              <View style={styles.crudGrid}>
                {/* READ */}
                <TouchableOpacity
                  style={[styles.crudPill, perms.r && styles.crudPillActiveR]}
                  onPress={() => togglePermission(mod.id, 'r')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.crudLetter, perms.r && styles.crudLetterActiveR]}>
                    R
                  </Text>
                  <Text style={[styles.crudSubLabel, perms.r && styles.crudSubLabelActiveR]}>
                    READ
                  </Text>
                </TouchableOpacity>

                {/* CREATE */}
                <TouchableOpacity
                  style={[styles.crudPill, perms.c && styles.crudPillActiveC]}
                  onPress={() => togglePermission(mod.id, 'c')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.crudLetter, perms.c && styles.crudLetterActiveC]}>
                    C
                  </Text>
                  <Text style={[styles.crudSubLabel, perms.c && styles.crudSubLabelActiveC]}>
                    CREATE
                  </Text>
                </TouchableOpacity>

                {/* UPDATE */}
                <TouchableOpacity
                  style={[styles.crudPill, perms.u && styles.crudPillActiveU]}
                  onPress={() => togglePermission(mod.id, 'u')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.crudLetter, perms.u && styles.crudLetterActiveU]}>
                    U
                  </Text>
                  <Text style={[styles.crudSubLabel, perms.u && styles.crudSubLabelActiveU]}>
                    UPDATE
                  </Text>
                </TouchableOpacity>

                {/* DELETE */}
                <TouchableOpacity
                  style={[styles.crudPill, perms.d && styles.crudPillActiveD]}
                  onPress={() => togglePermission(mod.id, 'd')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.crudLetter, perms.d && styles.crudLetterActiveD]}>
                    D
                  </Text>
                  <Text style={[styles.crudSubLabel, perms.d && styles.crudSubLabelActiveD]}>
                    DELETE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

    </AppScreenContainer>
  );
};
