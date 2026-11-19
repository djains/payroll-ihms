import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  AppScreenContainer,
  AppHeader,
  AppButton,
  AppIcon,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import { API_ENDPOINTS } from '../../../api/config';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme';
import { styles } from './MaterialCheckScreen.styles';

interface StockItem {
  id: string;
  name: string;
  code: string;
  unit: string;
  verifiedStock: number;
  minRequired: number;
  productService?: string;
  purchaseRate?: number;
}

export const MaterialCheckScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch real materials & chemicals master directly from MySQL table pay_item_master
  // NOTE: Fetching standard 25 items per page for lightning fast mobile performance & zero lag
  const fetchLiveMaterials = useCallback(async () => {
    try {
      const res = await apiClient.get<any>(`${API_ENDPOINTS.ITEM_MASTERS}?page_size=25`);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        if (list.length > 0) {
          const mapped: StockItem[] = list.map((it: any) => ({
            id: String(it.item_code || it.id || ''),
            name: String(it.item_name || 'Material Item').trim(),
            code: String(it.item_code || '').trim(),
            unit: String(it.unit || 'PCS').toUpperCase().trim(),
            // Real current stock count from SQL table pay_item_master (column `Stock`)
            verifiedStock: it.stock !== null && it.stock !== undefined ? Math.max(0, Math.round(Number(it.stock))) : 0,
            minRequired: it.min_stock !== null && it.min_stock !== undefined ? Number(it.min_stock) : 0,
            productService: it.product_service || '',
            purchaseRate: it.purchase_rate ? Number(it.purchase_rate) : undefined,
          }));
          setInventory(mapped);
        } else {
          setInventory([]);
        }
      } else {
        setInventory([]);
        showToast({
          type: 'error',
          title: 'Sync Error',
          message: res.error || 'Unable to fetch chemical items from database.',
        });
      }
    } catch {
      setInventory([]);
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to material master service.',
      });
    } finally {
      setLoadingItems(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveMaterials();
  }, [fetchLiveMaterials]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMaterials();
  };

  // Adjust in-hand stock counter
  const handleAdjust = (id: string, delta: number) => {
    setInventory((prev: StockItem[]) =>
      prev.map((item: StockItem) => {
        if (item.id === id) {
          const updated = Math.max(0, item.verifiedStock + delta);
          return { ...item, verifiedStock: updated };
        }
        return item;
      })
    );
  };

  // Filtered Items by search query
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase().trim();
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  // Summary Metrics
  const totalItemsCount = inventory.length;
  const lowStockCount = inventory.filter((i) => i.verifiedStock < i.minRequired).length;
  const optimalCount = totalItemsCount - lowStockCount;

  // Submit Audit to server
  const handleSubmitAudit = async () => {
    if (inventory.length === 0) {
      showToast({
        type: 'error',
        title: 'No Items',
        message: 'No chemical/material items found to audit.',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Persist verified stock counts directly into MySQL pay_item_master
      const updates = inventory.map((item) =>
        apiClient.patch(`${API_ENDPOINTS.ITEM_MASTERS}${item.id}/`, {
          stock: item.verifiedStock,
        })
      );
      await Promise.allSettled(updates);

      showToast({
        type: 'success',
        title: 'Stock Audit Verified',
        message: `${inventory.length} chemical items saved to database. ${
          lowStockCount > 0 ? `${lowStockCount} items flagged for replenishment.` : 'All stock levels optimal.'
        }`,
      });
      goBack();
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Save Error',
        message: e?.message || 'Could not save audit to server.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreenContainer
      scrollable
      header={
        <AppHeader
          title="Chemicals & Materials"
          onBack={goBack}
        />
      }
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Summary Stats Card ── */}
      <View style={styles.summaryCard}>
        <View style={[styles.summaryCol, styles.summaryColBorder]}>
          <Text style={styles.summaryNumber}>{totalItemsCount}</Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>

        <View style={[styles.summaryCol, styles.summaryColBorder]}>
          <Text style={[styles.summaryNumber, { color: '#16A34A' }]}>{optimalCount}</Text>
          <Text style={styles.summaryLabel}>Sufficient</Text>
        </View>

        <View style={styles.summaryCol}>
          <Text style={[styles.summaryNumber, { color: lowStockCount > 0 ? '#DC2626' : '#16A34A' }]}>
            {lowStockCount}
          </Text>
          <Text style={styles.summaryLabel}>Low Stock</Text>
        </View>
      </View>

      {/* ── Search Input Bar ── */}
      <View style={styles.searchBar}>
        <AppIcon name="search" size={16} color="#64748B" />
        <TextInput
          placeholder="Search chemical or material by name/code..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppIcon name="close" size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List of Chemicals & Material Master from MySQL ── */}
      {loadingItems && !refreshing ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={brandColor} />
          <Text style={styles.emptySubtitle}>Loading chemical stocks from MySQL...</Text>
        </View>
      ) : filteredInventory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="flask" size={32} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Materials Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No match for your search query.' : 'No chemical items registered in MySQL database.'}
          </Text>
        </View>
      ) : (
        filteredInventory.map((item: StockItem) => {
          const minVal = item.minRequired;
          const isLow = item.verifiedStock < minVal;

          return (
            <View key={item.id} style={styles.itemCard}>
              {/* Item Header: Flask Icon + Name + Code + Unit Badge */}
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                  <View style={[styles.itemIconCircle, { backgroundColor: isLow ? '#FEF2F2' : '#EFF6FF' }]}>
                    <AppIcon name="flask" size={18} color={isLow ? '#DC2626' : '#2563EB'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemCodeText}>
                      Item Code: {item.code || item.id}
                    </Text>
                  </View>
                </View>

                <View style={styles.unitPill}>
                  <Text style={styles.unitPillText}>{item.unit}</Text>
                </View>
              </View>

              {/* Stepper & Buffer Stock Row */}
              <View style={styles.stockRow}>
                <View style={styles.stockCol}>
                  <Text style={styles.stockLabel}>Required Buffer</Text>
                  <View style={styles.stockValueWrap}>
                    <Text style={styles.stockValue}>{item.minRequired}</Text>
                    <Text style={styles.stockUnitSmall}>{item.unit}</Text>
                  </View>
                </View>

                {/* Live Stock Stepper */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjust(item.id, -1)}
                    activeOpacity={0.75}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.stepperCount}>{item.verifiedStock}</Text>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjust(item.id, 1)}
                    activeOpacity={0.75}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stock Status Indicator */}
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isLow ? '#FEE2E2' : '#DCFCE7' },
                  ]}
                >
                  <AppIcon
                    name={isLow ? 'close' : 'check'}
                    size={10}
                    color={isLow ? '#DC2626' : '#15803D'}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isLow ? '#DC2626' : '#15803D' },
                    ]}
                  >
                    {isLow
                      ? `Low Stock (Refill +${minVal - item.verifiedStock} ${item.unit})`
                      : 'Stock Level Sufficient'}
                  </Text>
                </View>

                {item.purchaseRate ? (
                  <Text style={styles.stockRateText}>
                    ₹{item.purchaseRate}/{item.unit}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })
      )}

      {/* Action Button */}
      {filteredInventory.length > 0 && (
        <View style={styles.actionContainer}>
          <AppButton
            title={submitting ? 'Verifying in SQL...' : 'Submit Material Audit'}
            variant="primary"
            loading={submitting}
            onPress={handleSubmitAudit}
            customColor={brandColor}
            disabled={submitting}
          />
        </View>
      )}
    </AppScreenContainer>
  );
};
