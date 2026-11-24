import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AppIcon } from './AppIcon';
import { fontSizes, ms, borderRadius, spacing } from '../../theme';

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordEvaluation {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
  color: string;
  activeBars: number;
  criteria: PasswordCriteria;
}

export const evaluatePassword = (password: string, minChars: number = 9): PasswordEvaluation => {
  const criteria: PasswordCriteria = {
    hasMinLength: password.length >= minChars,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      level: 'weak',
      label: '',
      color: '#CBD5E1',
      activeBars: 0,
      criteria,
    };
  }

  let passedCount = 0;
  if (criteria.hasMinLength) passedCount += 2;
  else if (password.length >= 6) passedCount += 1;

  if (criteria.hasLower) passedCount += 1;
  if (criteria.hasUpper) passedCount += 1;
  if (criteria.hasNumber) passedCount += 1;
  if (criteria.hasSpecial) passedCount += 1;

  let level: PasswordStrengthLevel = 'weak';
  let label = 'Weak';
  let color = '#EF4444';
  let activeBars = 1;

  if (!criteria.hasMinLength || passedCount <= 2) {
    level = 'weak';
    label = 'Weak';
    color = '#EF4444';
    activeBars = 1;
  } else if (passedCount <= 4) {
    level = 'medium';
    label = 'Medium';
    color = '#F59E0B';
    activeBars = 2;
  } else if (passedCount === 5) {
    level = 'strong';
    label = 'Strong';
    color = '#10B981';
    activeBars = 3;
  } else {
    level = 'very-strong';
    label = 'Very Strong';
    color = '#059669';
    activeBars = 4;
  }

  return {
    score: passedCount,
    level,
    label,
    color,
    activeBars,
    criteria,
  };
};

export interface PasswordStrengthMeterProps {
  password: string;
  minChars?: number;
  showRequirements?: boolean;
  style?: ViewStyle;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  minChars = 9,
  showRequirements = true,
  style,
}) => {
  if (!password) {
    return null;
  }

  const { label, color, activeBars, criteria } = evaluatePassword(password, minChars);

  return (
    <View style={[styles.container, style]}>
      {/* Top Row: Segmented Bars + Strength Label */}
      <View style={styles.topRow}>
        <View style={styles.barsContainer}>
          {[1, 2, 3, 4].map((barIdx) => (
            <View
              key={barIdx}
              style={[
                styles.barSegment,
                {
                  backgroundColor: barIdx <= activeBars ? color : '#E2E8F0',
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.badge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
          <View style={[styles.badgeDot, { backgroundColor: color }]} />
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>

      {/* Checklist Pills */}
      {showRequirements && (
        <View style={styles.pillsWrap}>
          <View style={[styles.pill, criteria.hasMinLength && styles.pillPassed]}>
            <AppIcon
              name={criteria.hasMinLength ? 'checkmark' : 'lock'}
              size={9}
              color={criteria.hasMinLength ? '#15803D' : '#64748B'}
            />
            <Text style={[styles.pillText, criteria.hasMinLength && styles.pillTextPassed]}>
              Min {minChars} chars
            </Text>
          </View>

          <View style={[styles.pill, (criteria.hasLower || criteria.hasUpper) && styles.pillPassed]}>
            <AppIcon
              name={criteria.hasLower || criteria.hasUpper ? 'checkmark' : 'shield'}
              size={9}
              color={criteria.hasLower || criteria.hasUpper ? '#15803D' : '#64748B'}
            />
            <Text style={[styles.pillText, (criteria.hasLower || criteria.hasUpper) && styles.pillTextPassed]}>
              Letters (Aa)
            </Text>
          </View>

          <View style={[styles.pill, criteria.hasNumber && styles.pillPassed]}>
            <AppIcon
              name={criteria.hasNumber ? 'checkmark' : 'shield'}
              size={9}
              color={criteria.hasNumber ? '#15803D' : '#64748B'}
            />
            <Text style={[styles.pillText, criteria.hasNumber && styles.pillTextPassed]}>
              Number (0-9)
            </Text>
          </View>

          <View style={[styles.pill, criteria.hasSpecial && styles.pillPassed]}>
            <AppIcon
              name={criteria.hasSpecial ? 'checkmark' : 'shield'}
              size={9}
              color={criteria.hasSpecial ? '#15803D' : '#64748B'}
            />
            <Text style={[styles.pillText, criteria.hasSpecial && styles.pillTextPassed]}>
              Symbol (@#$)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: ms(4),
    marginBottom: ms(8),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(10),
    marginBottom: ms(6),
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    height: ms(4),
  },
  barSegment: {
    flex: 1,
    height: '100%',
    borderRadius: ms(2),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  badgeDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(2.5),
  },
  badgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  pillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ms(6),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2.5),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillPassed: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  pillText: {
    fontSize: fontSizes.xxs,
    color: '#64748B',
    fontWeight: '600',
  },
  pillTextPassed: {
    color: '#15803D',
    fontWeight: '700',
  },
});
