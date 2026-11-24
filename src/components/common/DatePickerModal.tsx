import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { colors } from '../../theme/colors';
import { ms } from '../../theme/responsive';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { fontSizes } from '../../theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (formattedDate: string, date: Date) => void;
  initialDate?: string; // DD/MM/YYYY or YYYY-MM-DD
  title?: string;
  minYear?: number;
  maxYear?: number;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialDate,
  title = 'Select Date of Birth',
  minYear = 1950,
  maxYear = new Date().getFullYear(),
}) => {
  // Parse initial date
  const parsedInitial = useMemo(() => {
    if (initialDate && initialDate.trim()) {
      const slashParts = initialDate.trim().split('/');
      if (slashParts.length === 3) {
        const d = parseInt(slashParts[0], 10);
        const m = parseInt(slashParts[1], 10) - 1;
        const y = parseInt(slashParts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          return new Date(y, m, d);
        }
      }
      const dashParts = initialDate.trim().split('-');
      if (dashParts.length === 3) {
        const y = parseInt(dashParts[0], 10);
        const m = parseInt(dashParts[1], 10) - 1;
        const d = parseInt(dashParts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          return new Date(y, m, d);
        }
      }
    }
    // Default: 25 years ago for realistic DOB starting point
    const def = new Date();
    def.setFullYear(def.getFullYear() - 25);
    return def;
  }, [initialDate]);

  const [selectedYear, setSelectedYear] = useState<number>(parsedInitial.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(parsedInitial.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(parsedInitial.getDate());

  // View mode: 'calendar' | 'year' | 'month'
  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  // Days in selected month & first day of week
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).getDay();
  }, [selectedYear, selectedMonth]);

  // Generate list of years (newest to oldest for easier browsing, or oldest to newest)
  const yearsList = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      if (selectedYear > minYear) {
        setSelectedYear((y) => y - 1);
        setSelectedMonth(11);
      }
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      if (selectedYear < maxYear) {
        setSelectedYear((y) => y + 1);
        setSelectedMonth(0);
      }
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const validDay = Math.min(selectedDay, daysInMonth);
    const dateObj = new Date(selectedYear, selectedMonth, validDay);
    const dd = String(validDay).padStart(2, '0');
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const yyyy = String(selectedYear);
    const formatted = `${dd}/${mm}/${yyyy}`;
    onSelect(formatted, dateObj);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <AppIcon name="calendar" size={18} color="#0F766E" />
                  <Text style={styles.headerTitle}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Selected Date Summary Display */}
              <View style={styles.summaryBar}>
                <Text style={styles.summaryLabel}>Selected Date:</Text>
                <Text style={styles.summaryValue}>
                  {String(Math.min(selectedDay, daysInMonth)).padStart(2, '0')}{' '}
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </Text>
              </View>

              {/* Month / Year Quick Switcher Bar */}
              <View style={styles.navBar}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navArrow}
                  activeOpacity={0.7}
                  disabled={viewMode !== 'calendar'}
                >
                  <AppIcon name="chevronLeft" size={16} color={viewMode === 'calendar' ? '#111827' : '#D1D5DB'} />
                </TouchableOpacity>

                <View style={styles.modeButtonsRow}>
                  <TouchableOpacity
                    onPress={() => setViewMode(viewMode === 'month' ? 'calendar' : 'month')}
                    style={[styles.pillBtn, viewMode === 'month' && styles.pillBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillBtnText, viewMode === 'month' && styles.pillBtnTextActive]}>
                      {MONTH_NAMES[selectedMonth]}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                    style={[styles.pillBtn, viewMode === 'year' && styles.pillBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillBtnText, viewMode === 'year' && styles.pillBtnTextActive]}>
                      {selectedYear}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navArrow}
                  activeOpacity={0.7}
                  disabled={viewMode !== 'calendar'}
                >
                  <AppIcon name="chevronRight" size={16} color={viewMode === 'calendar' ? '#111827' : '#D1D5DB'} />
                </TouchableOpacity>
              </View>

              {/* VIEW MODE: Year Selector */}
              {viewMode === 'year' && (
                <View style={styles.selectorContainer}>
                  <Text style={styles.subPrompt}>Tap to select Birth Year:</Text>
                  <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={true}>
                    <View style={styles.gridWrap}>
                      {yearsList.map((y) => {
                        const isCurrent = y === selectedYear;
                        return (
                          <TouchableOpacity
                            key={y}
                            onPress={() => {
                              setSelectedYear(y);
                              setViewMode('calendar');
                            }}
                            style={[styles.gridItem, isCurrent && styles.gridItemActive]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.gridItemText, isCurrent && styles.gridItemTextActive]}>
                              {y}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* VIEW MODE: Month Selector */}
              {viewMode === 'month' && (
                <View style={styles.selectorContainer}>
                  <Text style={styles.subPrompt}>Tap to select Month:</Text>
                  <View style={styles.gridWrap}>
                    {MONTH_NAMES.map((name, idx) => {
                      const isCurrent = idx === selectedMonth;
                      return (
                        <TouchableOpacity
                          key={name}
                          onPress={() => {
                            setSelectedMonth(idx);
                            setViewMode('calendar');
                          }}
                          style={[styles.monthItem, isCurrent && styles.gridItemActive]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.gridItemText, isCurrent && styles.gridItemTextActive]}>
                            {name.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* VIEW MODE: Standard Calendar Day Grid */}
              {viewMode === 'calendar' && (
                <View style={styles.calendarContainer}>
                  {/* Weekday Labels */}
                  <View style={styles.weekdayRow}>
                    {WEEKDAY_NAMES.map((w) => (
                      <View key={w} style={styles.weekdayCell}>
                        <Text style={styles.weekdayText}>{w}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Day Cells Grid */}
                  <View style={styles.daysGrid}>
                    {/* Empty padding cells for first day offset */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <View key={`empty_${i}`} style={styles.dayCell} />
                    ))}

                    {/* Day numbers 1 .. daysInMonth */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = dayNum === selectedDay;

                      return (
                        <TouchableOpacity
                          key={`day_${dayNum}`}
                          onPress={() => setSelectedDay(dayNum)}
                          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                            {dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn} activeOpacity={0.8}>
                  <Text style={styles.confirmBtnText}>Confirm Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    width: Math.min(SCREEN_WIDTH - 32, ms(360)),
    maxHeight: '90%',
    padding: ms(18),
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: ms(8),
  },
  closeBtn: {
    padding: ms(6),
  },
  closeText: {
    fontSize: ms(16),
    color: '#64748B',
    fontWeight: '700',
  },
  summaryBar: {
    backgroundColor: '#F0FDFA',
    borderRadius: ms(10),
    paddingVertical: ms(8),
    paddingHorizontal: ms(12),
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: ms(11),
    color: '#0F766E',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: ms(12.5),
    color: '#0F766E',
    fontWeight: '800',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
    paddingHorizontal: ms(4),
  },
  navArrow: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(8),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  pillBtn: {
    paddingVertical: ms(6),
    paddingHorizontal: ms(12),
    borderRadius: ms(16),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtnActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  pillBtnText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#334155',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
  },
  calendarContainer: {
    marginBottom: ms(10),
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: ms(6),
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(4),
  },
  weekdayText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(8),
    marginVertical: ms(2),
  },
  dayCellSelected: {
    backgroundColor: '#0F766E',
    borderRadius: ms(18),
  },
  dayText: {
    fontSize: ms(12.5),
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectorContainer: {
    paddingVertical: ms(6),
    marginBottom: ms(10),
  },
  subPrompt: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: ms(8),
  },
  yearScroll: {
    maxHeight: ms(200),
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(6),
    justifyContent: 'center',
  },
  gridItem: {
    width: '23%',
    paddingVertical: ms(8),
    borderRadius: ms(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  monthItem: {
    width: '30%',
    paddingVertical: ms(10),
    borderRadius: ms(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  gridItemActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  gridItemText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#334155',
  },
  gridItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ms(10),
    marginTop: ms(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: ms(12),
  },
  cancelBtn: {
    paddingVertical: ms(9),
    paddingHorizontal: ms(16),
    borderRadius: ms(10),
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: ms(12.5),
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    paddingVertical: ms(9),
    paddingHorizontal: ms(18),
    borderRadius: ms(10),
    backgroundColor: '#0F766E',
    ...shadows.sm,
  },
  confirmBtnText: {
    fontSize: ms(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
