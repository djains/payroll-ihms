import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { AppScreenContainer } from '../../../components/common/AppScreenContainer';
import { AppHeader } from '../../../components/common/AppHeader';
import { AppIcon } from '../../../components/common/AppIcon';
import { complaintApi, ComplaintItem } from '../../../api/complaint.api';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { useNavigation } from '../../../navigation/navigationContext';
import { styles } from './EmployeeComplaintScreen.styles';

export const EmployeeComplaintScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentUser } = useAuthStore();
  const unitCode = currentUser?.scope?.unit_code || currentUser?.branchOrUnit || '';

  // Active Tab: 'NEW' = Raise Query, 'HISTORY' = My Queries
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');

  // Form State
  const [priority, setPriority] = useState<'TOP' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [types, setTypes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({});
  const [remark, setRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState<boolean>(false);

  // History State
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Load Categories on mount & when Priority changes
  const loadCategories = useCallback(async (p: string) => {
    setIsLoadingDropdowns(true);
    try {
      let cats = await complaintApi.getCategoriesByPriority(p);
      if (!cats || cats.length === 0) {
        cats = await complaintApi.getCategories();
      }
      // Guarantee 'Other' is always an option in categories
      const cleanCats = (cats || []).filter((c) => c.toLowerCase() !== 'other');
      const finalCats = [...cleanCats, 'Other'];
      setCategories(finalCats);
      if (finalCats.length > 0) {
        setSelectedCategory(finalCats[0]);
      } else {
        setSelectedCategory('Other');
        setTypes([]);
      }
    } catch {
      setCategories(['Other']);
      setSelectedCategory('Other');
    } finally {
      setIsLoadingDropdowns(false);
    }
  }, []);

  useEffect(() => {
    loadCategories(priority);
  }, [priority, loadCategories]);

  // Load Complaint Types when Category or Priority changes
  useEffect(() => {
    if (!selectedCategory || selectedCategory === 'Other') {
      setTypes([]);
      setSelectedTypes({});
      return;
    }
    let isCancelled = false;
    complaintApi.getComplaintTypes(priority, selectedCategory).then((fetchedTypes) => {
      if (!isCancelled) {
        setTypes(fetchedTypes);
        if (fetchedTypes.length > 0) {
          setSelectedTypes({ [fetchedTypes[0]]: true });
        } else {
          setSelectedTypes({});
        }
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [priority, selectedCategory]);

  // Load My Complaints Grid
  const loadComplaints = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) setIsRefreshing(true);
    else setIsLoadingHistory(true);

    try {
      const res = await complaintApi.getMyComplaints(unitCode);
      if (res.success && res.data) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Failed to load queries', type: 'error' });
    } finally {
      setIsLoadingHistory(false);
      setIsRefreshing(false);
    }
  }, [unitCode]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Toggle Type Checkbox
  const toggleType = (t: string) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [t]: !prev[t],
    }));
  };

  // Helper: Count words in a string
  const countWords = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  // Enforce 50 words max limit in real-time
  const handleRemarkChange = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length > 50) {
      const allowed = text.split(/\s+/).slice(0, 50).join(' ');
      setRemark(allowed);
      showToast({ message: 'Maximum 50 words limit reached', type: 'warning' });
      return;
    }
    setRemark(text);
  };

  const wordCount = useMemo(() => countWords(remark), [remark]);

  // Submit Complaint
  const handleSubmit = async () => {
    if (selectedCategory === 'Other' && !customCategory.trim()) {
      showToast({ message: 'Please specify your custom category / subject', type: 'warning' });
      return;
    }

    if (!remark.trim()) {
      showToast({ message: 'Please enter a description / remark', type: 'warning' });
      return;
    }

    if (countWords(remark) > 50) {
      showToast({ message: 'Query description cannot exceed 50 words', type: 'warning' });
      return;
    }

    const finalCategory = selectedCategory === 'Other' ? customCategory.trim() : (selectedCategory || 'General');
    const chosenNames = types.filter((t) => selectedTypes[t]);
    const finalNames = chosenNames.length > 0 ? chosenNames : [finalCategory || 'General Query'];

    setIsSubmitting(true);
    try {
      const res = await complaintApi.sendComplaint({
        priority,
        category: finalCategory,
        names: finalNames,
        remark: remark.trim(),
        unitCode,
      });

      if (res.success) {
        showToast({ message: res.message || 'Query submitted successfully!', type: 'success' });
        setRemark('');
        setCustomCategory('');
        setSelectedTypes({});
        setActiveTab('HISTORY');
        loadComplaints();
      } else {
        showToast({ message: res.message || 'Failed to submit query', type: 'error' });
      }
    } catch (e: any) {
      showToast({ message: e?.message || 'Network error occurred', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Completed by worker after resolution
  const handleMarkComplete = (id: number) => {
    Alert.alert(
      'Complete Query',
      'Are you satisfied with the resolution and want to close this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Close Ticket',
          style: 'default',
          onPress: async () => {
            setCompletingId(id);
            try {
              const res = await complaintApi.completeComplaint(id);
              if (res.success) {
                showToast({ message: 'Ticket closed successfully', type: 'success' });
                loadComplaints();
              } else {
                showToast({ message: res.message || 'Could not close ticket', type: 'error' });
              }
            } catch (e: any) {
              showToast({ message: e?.message || 'Error closing ticket', type: 'error' });
            } finally {
              setCompletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Help & Support"
          subtitle="Submit queries & track resolution"
          onBack={goBack}
        />
      }
      scrollable={false}
    >
      {/* 1. FIXED TOP TABS BAR (OUTSIDE SCROLLVIEW - 100% PERFECT FIT) */}
      <View style={styles.topTabsWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'NEW' && styles.tabBtnActive]}
            onPress={() => setActiveTab('NEW')}
            activeOpacity={0.8}
          >
            <AppIcon
              name="edit"
              size={14}
              color={activeTab === 'NEW' ? '#0F766E' : '#64748B'}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'NEW' && styles.tabBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Raise Query
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'HISTORY' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('HISTORY');
              loadComplaints();
            }}
            activeOpacity={0.8}
          >
            <AppIcon
              name="ticket"
              size={14}
              color={activeTab === 'HISTORY' ? '#0F766E' : '#64748B'}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'HISTORY' && styles.tabBtnTextActive,
              ]}
              numberOfLines={1}
            >
              My Queries
            </Text>
            {complaints.length > 0 && (
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'HISTORY' && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'HISTORY' && styles.tabCountTextActive,
                  ]}
                >
                  {complaints.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          activeTab === 'HISTORY' ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadComplaints(true)}
              colors={['#0F766E']}
              tintColor="#0F766E"
            />
          ) : undefined
        }
      >

        {/* TAB 1: RAISE QUERY FORM */}
        {activeTab === 'NEW' && (
          <View style={styles.formCard}>
            {/* Header with Icon */}
            <View style={styles.formHeaderRow}>
              <View style={styles.formHeaderIconWrap}>
                <AppIcon name="message-circle" size={20} color="#0F766E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formHeaderTitle}>Submit New Query / Complaint</Text>
                <Text style={styles.formHeaderSubtitle}>
                  Select priority and category for quick management response
                </Text>
              </View>
            </View>

            {/* 1. Priority Selector (Chips just like Complaint Category) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Priority Level</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.priorityScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.priorityChip,
                    priority === 'TOP' && styles.priorityChipTopActive,
                  ]}
                  onPress={() => setPriority('TOP')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priority === 'TOP' ? '#DC2626' : '#94A3B8' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityChipText,
                      priority === 'TOP' && styles.priorityChipTextTopActive,
                    ]}
                  >
                    Urgent (Top)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityChip,
                    priority === 'MEDIUM' && styles.priorityChipMedActive,
                  ]}
                  onPress={() => setPriority('MEDIUM')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priority === 'MEDIUM' ? '#D97706' : '#94A3B8' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityChipText,
                      priority === 'MEDIUM' && styles.priorityChipTextMedActive,
                    ]}
                  >
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityChip,
                    priority === 'LOW' && styles.priorityChipLowActive,
                  ]}
                  onPress={() => setPriority('LOW')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priority === 'LOW' ? '#0F766E' : '#94A3B8' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityChipText,
                      priority === 'LOW' && styles.priorityChipTextLowActive,
                    ]}
                  >
                    Normal / Low
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 2. Category Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Complaint Category</Text>
              {isLoadingDropdowns ? (
                <ActivityIndicator size="small" color="#0F766E" style={{ marginVertical: 12 }} />
              ) : categories.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {categories.map((c) => {
                    const isSelected = selectedCategory === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                        onPress={() => setSelectedCategory(c)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <AppIcon name="check" size={12} color="#FFFFFF" />
                        )}
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
                  No categories available
                </Text>
              )}
            </View>

            {/* Custom Category Input if 'Other' selected */}
            {selectedCategory === 'Other' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Custom Category / Issue Name *</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Uniform size issue, PF transfer, ID card..."
                    placeholderTextColor="#94A3B8"
                    value={customCategory}
                    onChangeText={setCustomCategory}
                  />
                </View>
              </View>
            )}

            {/* 3. Specific Types Multi-select (if available) */}
            {types.length > 0 && selectedCategory !== 'Other' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Specific Issue Type</Text>
                <View style={styles.typesWrapper}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {types.map((t) => {
                      const isChecked = !!selectedTypes[t];
                      return (
                        <TouchableOpacity
                          key={t}
                          style={styles.typeItem}
                          onPress={() => toggleType(t)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isChecked && styles.checkboxChecked,
                            ]}
                          >
                            {isChecked && (
                              <AppIcon name="check" size={12} color="#FFFFFF" />
                            )}
                          </View>
                          <Text style={styles.typeItemText}>{t}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 4. Description / Remark with 50-words limit */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Query Description / Remarks *</Text>
              <View style={styles.textAreaWrap}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your issue in detail (maximum 50 words)..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={remark}
                  onChangeText={handleRemarkChange}
                  textAlignVertical="top"
                />
                <View
                  style={[
                    styles.textAreaCounterPill,
                    wordCount >= 50 && styles.textAreaCounterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.textAreaCounterText,
                      wordCount >= 50 && styles.textAreaCounterTextActive,
                    ]}
                  >
                    {wordCount}/50 words
                  </Text>
                </View>
              </View>
            </View>

            {/* 5. Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit Query</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: MY QUERIES / STATUS TRACKER */}
        {activeTab === 'HISTORY' && (
          <View>
            {isLoadingHistory && !isRefreshing ? (
              <ActivityIndicator size="large" color="#0F766E" style={{ marginVertical: 40 }} />
            ) : complaints.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconWrap}>
                  <AppIcon name="message-circle" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Queries Submitted Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Any complaint or support query you raise will appear here with live updates from management.
                </Text>
              </View>
            ) : (
              complaints.map((item) => {
                const st = String(item.status || '').toLowerCase();
                const isResolved = st.includes('resolve');
                const isComplete = st.includes('complete');
                const isInProcess = !isResolved && !isComplete;

                const priUpper = String(item.priority || '').toUpperCase();

                return (
                  <View key={item.Id} style={styles.ticketCard}>
                    {/* Top Bar: Ticket ID Badge & Status Pill */}
                    <View style={styles.cardTopBar}>
                      <View style={styles.ticketBadge}>
                        <AppIcon name="ticket" size={13} color="#0F766E" />
                        <Text style={styles.ticketBadgeText}>#{item.Id}</Text>
                      </View>

                      {/* Status Pill */}
                      <View
                        style={[
                          styles.statusPill,
                          isInProcess && styles.statusPillInProcess,
                          isResolved && styles.statusPillResolved,
                          isComplete && styles.statusPillComplete,
                        ]}
                      >
                        <Text
                          style={[
                            isInProcess && styles.statusPillTextInProcess,
                            isResolved && styles.statusPillTextResolved,
                            isComplete && styles.statusPillTextComplete,
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

                    {/* Priority & Date Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={[
                          styles.priorityTag,
                          priUpper.includes('TOP')
                            ? styles.priorityTagTop
                            : priUpper.includes('MED')
                            ? styles.priorityTagMed
                            : styles.priorityTagLow,
                        ]}
                      >
                        <Text
                          style={[
                            priUpper.includes('TOP')
                              ? styles.priorityTagTextTop
                              : priUpper.includes('MED')
                              ? styles.priorityTagTextMed
                              : styles.priorityTagTextLow,
                          ]}
                        >
                          {priUpper || 'NORMAL'}
                        </Text>
                      </View>
                      <Text style={styles.ticketDateText}>Raised: {item.date || '—'}</Text>
                    </View>

                    {/* Issue Title */}
                    <Text style={styles.ticketTitle}>{item.complaint_name || 'General Query'}</Text>

                    {/* Worker Query Description */}
                    {Boolean(item.Remark) && (
                      <View style={styles.userQueryBox}>
                        <Text style={styles.userQueryLabel}>Your Query Description</Text>
                        <Text style={styles.userQueryText}>{item.Remark}</Text>
                      </View>
                    )}

                    {/* Admin Reply Card */}
                    {Boolean(item.comment && item.comment.trim()) ? (
                      <View style={styles.adminReplyCard}>
                        <View style={styles.adminReplyHeader}>
                          <AppIcon name="check" size={14} color="#15803D" />
                          <Text style={styles.adminReplyTitle}>Management Reply</Text>
                        </View>
                        <Text style={styles.adminReplyText}>{item.comment}</Text>
                        {Boolean(item.resole_date && item.resole_date !== '00/00/000') && (
                          <Text style={styles.adminReplyFooter}>
                            Resolved on: {item.resole_date}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.awaitingNote}>
                        <AppIcon name="clock" size={12} color="#94A3B8" />
                        <Text style={styles.awaitingText}>
                          Awaiting reply from Head Office / Admin...
                        </Text>
                      </View>
                    )}

                    {/* Complete & Close Button (Only if Resolved) */}
                    {isResolved && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleMarkComplete(item.Id)}
                        disabled={completingId === item.Id}
                        activeOpacity={0.8}
                      >
                        {completingId === item.Id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.completeBtnText}>Mark Complete & Close</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </AppScreenContainer>
  );
};
