import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { styles } from './CompanyListScreen.styles';
import { AppScreenContainer, AppHeader, AppIcon } from '../../../components/common';
import { useNavigation, useNavigationState } from '../../../navigation/navigationContext';
import { superadminApi, BackendUserItem } from '../../../api';

interface CompanyItem {
  id: number;
  comp_code: string;
  company_name: string;
  company_short_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pin?: string;
  company_pan_no?: string;
  company_contact_no?: string;
  emp_series_init?: string;
  admin_user_id?: string;
  admin_name?: string;
  login_person?: string;
}

export const CompanyListScreen: React.FC = () => {
  const { goBack, navigate, reset } = useNavigation();
  const { history } = useNavigationState();

  const handleBack = () => {
    if (history.length > 1) {
      goBack();
    } else {
      reset('SuperAdminDashboard');
    }
  };

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCompanies = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [compRes, usersRes] = await Promise.allSettled([
        superadminApi.getCompanies(undefined, 1, 'all'),
        superadminApi.getUsers(undefined, undefined, 'all'),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value && usersRes.value.data) {
        const uList: any[] = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : (usersRes.value.data as any).results || [];
        setUsersList(uList);
      }

      if (compRes.status === 'fulfilled' && compRes.value && compRes.value.data) {
        const list = Array.isArray((compRes.value.data as any).results)
          ? (compRes.value.data as any).results
          : Array.isArray(compRes.value.data)
            ? compRes.value.data
            : [];
        setCompanies(list);
      }
    } catch (e) {
      console.warn('Failed to load companies:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        (c.company_name && c.company_name.toLowerCase().includes(q)) ||
        (c.comp_code && c.comp_code.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }, [companies, searchQuery]);

  const renderCompanyCard = ({ item }: { item: CompanyItem }) => {
    const initial = (item.company_name || 'C').charAt(0).toUpperCase();
    const locationStr = [item.city, item.state].filter(Boolean).join(', ') || 'Headquarters';

    const compCodeUpper = (item.comp_code || '').trim().toUpperCase();

    // Find the matching user in accounts_user
    // 1. Check if user's comp_code matches
    // 2. Or if username has "@COMP_CODE" (e.g. 001@C01)
    // 3. Or if only users like 001, 002 exist in accounts_user
    let rootAdminUsername = '';
    const compUsers = usersList.filter((u: any) => {
      const uComp = (u.comp_code || (u.company && (u.company.comp_code || u.company)) || '').trim().toUpperCase();
      const uName = (u.username || '').trim();
      return (
        (uComp && uComp === compCodeUpper) ||
        (uName.toUpperCase().includes(`@${compCodeUpper}`))
      );
    });

    if (compUsers.length > 0) {
      const adminUser =
        compUsers.find((u: any) => {
          const role = (u.current_role || '').trim().toLowerCase();
          return role.includes('company admin') || role === 'admin' || role === 'superadmin';
        }) || compUsers[0];
      const raw = (adminUser.username || adminUser.legacy_login_id || '').trim();
      rootAdminUsername = raw.includes('@') ? raw.split('@')[0] : raw;
    } else {
      // If accounts_user has indexed items like 001 for C01, 002 for C02
      // e.g. C01 -> 001, C02 -> 002
      const digitsOnly = compCodeUpper.replace(/\D/g, '');
      const candidateCode = digitsOnly ? digitsOnly.padStart(3, '0') : '';
      const matchedByNumber = usersList.find((u: any) => {
        const uName = (u.username || u.legacy_login_id || '').trim();
        return uName === candidateCode;
      });

      if (matchedByNumber) {
        rootAdminUsername = (matchedByNumber.username || matchedByNumber.legacy_login_id || '').trim();
      } else if (candidateCode && usersList.some((u: any) => (u.username || '').trim() === candidateCode)) {
        rootAdminUsername = candidateCode;
      } else if (candidateCode) {
        rootAdminUsername = candidateCode;
      } else {
        rootAdminUsername = '001';
      }
    }

    return (
      <View style={styles.card}>
        {/* Top Identity Row: Avatar Circle + Name + Badges */}
        <View style={styles.cardTopRow}>
          <View style={styles.companyAvatar}>
            <Text style={styles.companyAvatarText}>{initial}</Text>
          </View>
          <View style={styles.companyMeta}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.company_name || 'Unnamed Company'}
            </Text>
            <View style={styles.pillRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{item.comp_code}</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Structured Key-Value Information Box */}
        <View style={styles.infoBox}>
          {/* Location */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeftWrap}>
              <AppIcon name="map-pin" size={13} color="#64748B" />
              <Text style={styles.infoLabel}>Location</Text>
            </View>
            <Text style={styles.infoValue}>{locationStr}</Text>
          </View>

          {/* Postal PIN */}
          {item.pin ? (
            <View style={styles.infoRow}>
              <View style={styles.infoLeftWrap}>
                <AppIcon name="shield" size={13} color="#64748B" />
                <Text style={styles.infoLabel}>Postal Code</Text>
              </View>
              <Text style={styles.infoValue}>{item.pin}</Text>
            </View>
          ) : null}

          {/* Tax PAN */}
          {item.company_pan_no ? (
            <View style={styles.infoRow}>
              <View style={styles.infoLeftWrap}>
                <AppIcon name="document" size={13} color="#64748B" />
                <Text style={styles.infoLabel}>Company PAN</Text>
              </View>
              <Text style={styles.infoValue}>{item.company_pan_no}</Text>
            </View>
          ) : null}

          {/* Series Init */}
          {item.emp_series_init ? (
            <View style={styles.infoRow}>
              <View style={styles.infoLeftWrap}>
                <AppIcon name="user" size={13} color="#64748B" />
                <Text style={styles.infoLabel}>Worker Series</Text>
              </View>
              <Text style={styles.infoValue}>{item.emp_series_init}</Text>
            </View>
          ) : null}

          {/* Root Admin Username */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeftWrap}>
              <AppIcon name="user" size={13} color="#0284C7" />
              <Text style={styles.infoLabel}>Root Admin </Text>
            </View>
            <Text style={[styles.infoValue, { color: '#0369A1', fontWeight: '700' }]}>
              {rootAdminUsername}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Company Directory"
          subtitle={`${companies.length} ${companies.length === 1 ? 'Company' : 'Companies'} Registered`}
          onBack={handleBack}
          rightComponent={
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigate('AddCompany')}
              activeOpacity={0.8}
            >
              <AppIcon name="plus" size={13} color="#FFFFFF" />
              <Text style={styles.headerActionText}>Add Company</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      {/* 2. Global Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrap}>
          <AppIcon name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search company name, code, or city..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <AppIcon name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Main FlatList Body */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item) => String(item.id || item.comp_code)}
          renderItem={renderCompanyCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCompanies(true)}
              colors={['#0F766E']}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <View style={styles.emptyIconCircle}>
                <AppIcon name="building" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matches Found' : 'No Companies Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No companies matched "${searchQuery}".`
                  : 'Start by provisioning your first corporate tenant entity.'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigate('AddCompany')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionText}>+ Add Company</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </AppScreenContainer>
  );
};
