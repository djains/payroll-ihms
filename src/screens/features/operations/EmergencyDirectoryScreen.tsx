import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { styles } from './EmergencyDirectoryScreen.styles';
import { AppScreenContainer, AppHeader, AppIcon } from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useAuthStore } from '../../../store/authStore';
import { useTenantStore } from '../../../store/tenantStore';
import { apiClient } from '../../../api/client';
import { API_ENDPOINTS } from '../../../api/config';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';

interface ContactItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  icon: string;
  category: 'SITE_HEAD' | 'FIELD_OFFICER' | 'EMERGENCY_HELPLINE';
  badgeBg?: string;
  badgeColor?: string;
}

const STATIC_EMERGENCY_SERVICES: ContactItem[] = [
  {
    id: 'emg-1',
    name: 'National Emergency Response (Police / PCR)',
    role: 'Central Emergency Control Desk',
    phone: '112',
    icon: 'police',
    category: 'EMERGENCY_HELPLINE',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8',
  },
  {
    id: 'emg-2',
    name: 'Ambulance & Trauma Medical Care',
    role: 'Emergency Medical Services (EMS)',
    phone: '108',
    icon: 'medical',
    category: 'EMERGENCY_HELPLINE',
    badgeBg: '#FEF2F2',
    badgeColor: '#DC2626',
  },
  {
    id: 'emg-3',
    name: 'Fire Control Room & Disaster Rescue',
    role: 'Fire & Rescue Authority',
    phone: '101',
    icon: 'fire',
    category: 'EMERGENCY_HELPLINE',
    badgeBg: '#FFF7ED',
    badgeColor: '#EA580C',
  },
];

export const EmergencyDirectoryScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siteContacts, setSiteContacts] = useState<ContactItem[]>([]);
  const [fieldOfficers, setFieldOfficers] = useState<ContactItem[]>([]);

  const unitCode =
    currentUser?.branchOrUnit ||
    (currentUser as any)?.scope?.unit_code ||
    (currentUser as any)?.unitCode ||
    '';

  const unitName =
    (currentUser as any)?.scope?.unit_name ||
    currentUser?.branchOrUnit ||
    'Assigned Site';

  const brandColor = currentCompany?.brandColor || colors.primary;

  const fetchDirectoryFromSQL = useCallback(async () => {
    try {
      // 1. Fetch live Unit Master details (Location Head, Operations Head, Admin Head from master_unit / pay_unit_master)
      // 2. Fetch live Field Officers & Supervisors deployed at this unit from pay_employee_master
      const [unitRes, empRes] = await Promise.allSettled([
        apiClient.get<any>(`/api/masters/units/?unit_code=${encodeURIComponent(unitCode)}`),
        apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?unit_code=${encodeURIComponent(unitCode)}&active=1`),
      ]);

      const headsList: ContactItem[] = [];

      // Parse Live Unit Master
      if (unitRes.status === 'fulfilled' && unitRes.value.success && unitRes.value.data) {
        const rawData = unitRes.value.data;
        const uList = Array.isArray(rawData) ? rawData : rawData.results || [rawData];
        const u = uList.find((item: any) => String(item.unit_code || '').trim() === unitCode) || uList[0];

        if (u) {
          // Location Head
          if (u.location_head_name || u.LocationHead_Name) {
            const name = (u.location_head_name || u.LocationHead_Name || '').trim();
            const phone = (u.location_head_mobile || u.LocationHead_mobileno || '').trim();
            const email = (u.location_head_email || u.LocationHead_Emailid || '').trim();
            if (phone) {
              headsList.push({
                id: 'unit-loc-head',
                name: `${u.location_head_title || 'Mr.'} ${name}`.trim(),
                role: 'Site Location Head (Incharge)',
                phone,
                email,
                icon: 'building',
                category: 'SITE_HEAD',
                badgeBg: '#DCFCE7',
                badgeColor: '#15803D',
              });
            }
          }

          // Operations Head
          if (u.operation_head_name || u.OperationHead_Name) {
            const name = (u.operation_head_name || u.OperationHead_Name || '').trim();
            const phone = (u.operation_head_mobile || u.OperationHead_Mobileno || '').trim();
            const email = (u.operation_head_email || u.OperationHead_EmailId || '').trim();
            if (phone) {
              headsList.push({
                id: 'unit-ops-head',
                name: `${u.operation_head_title || 'Mr.'} ${name}`.trim(),
                role: 'Operations Head (Territory Lead)',
                phone,
                email,
                icon: 'person',
                category: 'SITE_HEAD',
                badgeBg: '#FEF3C7',
                badgeColor: '#B45309',
              });
            }
          }

          // Admin Head
          if (u.admin_head_name || u.adminhead_name) {
            const name = (u.admin_head_name || u.adminhead_name || '').trim();
            const phone = (u.admin_head_mobile || u.adminhead_mobile || '').trim();
            if (phone) {
              headsList.push({
                id: 'unit-adm-head',
                name,
                role: 'Facility & Admin Head',
                phone,
                icon: 'shield',
                category: 'SITE_HEAD',
                badgeBg: '#EDE9FE',
                badgeColor: '#7C3AED',
              });
            }
          }
        }
      }

      setSiteContacts(headsList);

      // Parse Live Duty Officers & Supervisors from pay_employee_master
      const officersList: ContactItem[] = [];
      if (empRes.status === 'fulfilled' && empRes.value.success && empRes.value.data) {
        const rawEmp = empRes.value.data;
        const eList = Array.isArray(rawEmp) ? rawEmp : rawEmp.results || [];

        eList.forEach((emp: any) => {
          const desig = String(emp.designation || emp.DESIGNATION_CODE || emp.grade_code || '').toUpperCase();
          const phone = String(emp.emp_mobile_no || emp.EMP_MOBILE_NO || emp.mobile || '').trim();
          const name = String(emp.emp_name || emp.EMP_NAME || '').trim();

          // Select Supervisory / Officer staff with a valid phone number
          const isOfficer =
            desig.includes('SO') ||
            desig.includes('SUPERVISOR') ||
            desig.includes('OFFICER') ||
            desig.includes('JSO') ||
            desig.includes('HEAD') ||
            desig.includes('MANAGER') ||
            desig === '0' ||
            desig === '9';

          if (isOfficer && phone && phone.length >= 10 && officersList.length < 8) {
            officersList.push({
              id: `emp-${emp.emp_code || emp.EMP_CODE || officersList.length}`,
              name,
              role: desig.includes('JSO')
                ? 'Junior Site Officer (JSO)'
                : desig.includes('SO') || desig === '0'
                  ? 'Site Operations Officer (SO)'
                  : 'Duty Supervisor',
              phone,
              icon: 'person',
              category: 'FIELD_OFFICER',
              badgeBg: '#F1F5F9',
              badgeColor: '#334155',
            });
          }
        });
      }

      setFieldOfficers(officersList);
    } catch {
      // Keep static graceful items if network offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [unitCode]);

  useEffect(() => {
    fetchDirectoryFromSQL();
  }, [fetchDirectoryFromSQL]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDirectoryFromSQL();
  };

  const renderContactCard = (c: ContactItem) => (
    <View key={c.id} style={styles.contactItem}>
      <View style={styles.contactLeft}>
        <View style={[styles.iconBox, c.badgeBg ? { backgroundColor: c.badgeBg } : null]}>
          <AppIcon name={c.icon as any} size={18} color={c.badgeColor || brandColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
          <Text style={styles.contactRole} numberOfLines={1}>{c.role}</Text>
          <Text style={styles.phoneText} numberOfLines={1}>{c.phone}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <AppScreenContainer
      scrollable
      header={
        <AppHeader
          title="Emergency & Site Directory"
          onBack={goBack}
        />
      }
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandColor]} />}
    >
      {/* ── Assigned Unit Scope Card (Enterprise Standard) ── */}
      <View style={styles.scopeCard}>
        <View style={styles.scopeIconWrap}>
          <AppIcon name="location" size={18} color="#0D9488" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scopeTitle} numberOfLines={1}>
            Enterprise {currentCompany?.code || 'C01'} • Emergency Directory
          </Text>
          <Text style={styles.scopeSubtitle} numberOfLines={1}>
            Unit {unitCode} • {unitName}
          </Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={brandColor} />
          <Text style={{ marginTop: 10, color: colors.textSecondary, fontSize: 13 }}>
            Loading live contacts from MySQL...
          </Text>
        </View>
      ) : (
        <>
          {/* SECTION 1: SITE & REGIONAL HEADS (LIVE FROM master_unit / pay_unit_master) */}
          <View style={{ marginBottom: 12 }}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="building" size={14} color="#0D9488" />
              <Text style={styles.sectionTitle}>
                Assigned Site Heads (Live SQL)
              </Text>
            </View>

            <View style={styles.card}>
              {siteContacts.map(renderContactCard)}
            </View>
          </View>

          {/* SECTION 2: DUTY SUPERVISORS & FIELD OFFICERS (LIVE FROM pay_employee_master) */}
          {fieldOfficers.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="users" size={14} color="#4F46E5" />
                <Text style={styles.sectionTitle}>
                  Site Duty Officers ({fieldOfficers.length})
                </Text>
              </View>

              <View style={styles.card}>
                {fieldOfficers.map(renderContactCard)}
              </View>
            </View>
          )}

          {/* SECTION 3: 24x7 NATIONAL EMERGENCY HELPLINES */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="shield" size={14} color="#DC2626" />
              <Text style={styles.sectionTitle}>
                24x7 Emergency First Responders
              </Text>
            </View>

            <View style={styles.card}>
              {STATIC_EMERGENCY_SERVICES.map(renderContactCard)}
            </View>
          </View>
        </>
      )}
    </AppScreenContainer>
  );
};
