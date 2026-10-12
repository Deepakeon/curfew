import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useCurfewSchedule } from '../hooks/useCurfewSchedule';
import { formatTime, isOvernightWindow } from '../services/schedule';
import { HardLockoutBanner } from './HardLockoutBanner';
import { canModifySettings } from '../services/hardLockout';
import { TimePickerModal } from './TimePickerModal';

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

interface TimeDropdownSelectProps {
  label: string;
  hour: number;
  minute: number;
  disabled?: boolean;
  onPress: () => void;
}

function TimeDropdownSelect({
  label,
  hour,
  minute,
  disabled = false,
  onPress,
}: TimeDropdownSelectProps) {
  const formattedTime = formatTime(hour, minute);

  return (
    <View style={styles.timeDropdownSection}>
      <Text style={styles.timeDropdownLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.timeDropdownTrigger,
          disabled && styles.timeDropdownTriggerDisabled,
        ]}
        onPress={onPress}
        activeOpacity={disabled ? 1 : 0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formattedTime}`}
        aria-label={`${label}: ${formattedTime}`}
        accessibilityState={{ disabled }}
      >
        <Text
          style={[
            styles.timeDropdownValue,
            disabled && styles.timeDropdownValueDisabled,
          ]}
        >
          {formattedTime}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? theme.colors.ash : theme.colors.mute}
        />
      </TouchableOpacity>
    </View>
  );
}

interface ScheduleEditorProps {
  isCurfewActive?: boolean;
}

export function ScheduleEditor({ isCurfewActive: propIsActive }: ScheduleEditorProps = {}) {
  const {
    schedule,
    isActive: engineIsActive,
    transition,
    toggleDay,
    toggleEnabled,
    setStartTime,
    setEndTime,
  } = useCurfewSchedule();

  const isActive = propIsActive !== undefined ? propIsActive : engineIsActive;
  const isLocked = !canModifySettings(isActive);
  const [lockoutAttempted, setLockoutAttempted] = useState(false);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const handleAttemptChange = () => {
    setLockoutAttempted(true);
  };

  const isOvernight = isOvernightWindow(schedule);
  const hoursRemaining = Math.floor(transition.minutesRemaining / 60);
  const minsRemaining = transition.minutesRemaining % 60;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hard Lockout Banner when active or attempted */}
      {(isLocked || lockoutAttempted) && (
        <HardLockoutBanner
          isAttempt={lockoutAttempted}
          message="Curfew is in progress. Schedule modifications are locked until the active Curfew Window ends."
        />
      )}

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.bannerHeader}>
          <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
          <Text style={styles.bannerTitle}>
            {isActive ? 'Curfew Window Active' : 'Curfew Standby'}
          </Text>
        </View>
        <Text style={styles.bannerSubtitle}>
          {schedule.enabled
            ? isActive
              ? `Enforcing restrictions until ${transition.targetTimeFormatted} (${hoursRemaining}h ${minsRemaining}m remaining).`
              : `Next Curfew Window begins at ${transition.targetTimeFormatted} (${hoursRemaining}h ${minsRemaining}m from now).`
            : 'Schedule is paused. Target apps are unrestricted.'}
        </Text>
      </View>

      {/* Master Enable Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.enableCardTextCol}>
            <Text style={styles.cardTitle}>Enforce Schedule</Text>
            <Text style={styles.cardSubtitle}>
              {isLocked
                ? 'Modifications locked during active Curfew Window'
                : 'Automatically restrict target apps during curfew'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.togglePill,
              schedule.enabled ? styles.togglePillActive : styles.togglePillInactive,
              isLocked && styles.togglePillDisabled,
            ]}
            onPress={() => {
              if (isLocked) {
                handleAttemptChange();
                return;
              }
              toggleEnabled();
            }}
            activeOpacity={isLocked ? 1 : 0.8}
            accessibilityRole="switch"
            accessibilityState={{ checked: schedule.enabled, disabled: isLocked }}
            accessibilityLabel={
              isLocked
                ? 'Curfew schedule locked (modifications restricted)'
                : schedule.enabled
                ? 'Curfew schedule enabled'
                : 'Curfew schedule disabled'
            }
            aria-label={
              isLocked
                ? 'Curfew schedule locked (modifications restricted)'
                : schedule.enabled
                ? 'Curfew schedule enabled'
                : 'Curfew schedule disabled'
            }
          >
            {isLocked ? (
              <Ionicons name="lock-closed" size={16} color={theme.colors.ash} />
            ) : schedule.enabled ? (
              <Ionicons name="checkmark" size={16} color={theme.colors.accentGreen} />
            ) : (
              <Ionicons name="close" size={16} color={theme.colors.mute} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Window Editor */}
      <Text style={styles.sectionHeader}>Curfew Window</Text>

      <View style={styles.card}>
        <TimeDropdownSelect
          label="Curfew Window starts"
          hour={schedule.startHour}
          minute={schedule.startMinute}
          disabled={isLocked}
          onPress={() => {
            if (isLocked) {
              handleAttemptChange();
              return;
            }
            setActivePicker('start');
          }}
        />

        <View style={styles.divider} />

        <TimeDropdownSelect
          label="Curfew Window ends"
          hour={schedule.endHour}
          minute={schedule.endMinute}
          disabled={isLocked}
          onPress={() => {
            if (isLocked) {
              handleAttemptChange();
              return;
            }
            setActivePicker('end');
          }}
        />

        {isOvernight ? (
          <View style={styles.overnightBadge}>
            <Text style={styles.overnightText}>Spans overnight across midnight</Text>
          </View>
        ) : null}
      </View>

      {/* Active Days Selector */}
      <Text style={styles.sectionHeader}>Active Days of Week</Text>

      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>
          {isLocked
            ? 'Days cannot be toggled while Curfew is in progress:'
            : 'Curfew applies on selected days:'}
        </Text>
        <View style={styles.daysRow}>
          {DAYS.map((day) => {
            const isDayActive = schedule.activeDays.includes(day.id);
            return (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayPill,
                  isDayActive ? styles.dayPillActive : styles.dayPillInactive,
                  isLocked && styles.dayPillDisabled,
                ]}
                onPress={() => {
                  if (isLocked) {
                    handleAttemptChange();
                    return;
                  }
                  toggleDay(day.id);
                }}
                activeOpacity={isLocked ? 1 : 0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isDayActive, disabled: isLocked }}
                accessibilityLabel={`${day.label}, ${isDayActive ? 'active' : 'inactive'}`}
                aria-label={`${day.label}, ${isDayActive ? 'active' : 'inactive'}`}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isDayActive ? styles.dayLabelActive : styles.dayLabelInactive,
                    isLocked && styles.dayLabelDisabled,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 15-Minute Interval Time Picker Modal */}
      <TimePickerModal
        visible={activePicker !== null}
        title={activePicker === 'start' ? 'Curfew Window starts' : 'Curfew Window ends'}
        selectedHour={activePicker === 'start' ? schedule.startHour : schedule.endHour}
        selectedMinute={activePicker === 'start' ? schedule.startMinute : schedule.endMinute}
        onSelect={(hour, minute) => {
          if (activePicker === 'start') {
            setStartTime(hour, minute);
          } else if (activePicker === 'end') {
            setEndTime(hour, minute);
          }
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  statusBanner: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  dotActive: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotInactive: {
    backgroundColor: theme.colors.accentYellow,
  },
  bannerTitle: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
  },
  bannerSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.body,
  },
  sectionHeader: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enableCardTextCol: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
  },
  cardSubtitle: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
    marginTop: 2,
  },
  togglePill: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePillActive: {
    borderColor: theme.colors.accentGreen,
  },
  togglePillInactive: {
    borderColor: theme.colors.hairline,
  },
  togglePillDisabled: {
    opacity: 0.6,
    borderColor: theme.colors.hairline,
  },
  timeDropdownSection: {
    paddingVertical: theme.spacing.xs,
  },
  timeDropdownLabel: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    marginBottom: theme.spacing.xs,
  },
  timeDropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 46,
  },
  timeDropdownTriggerDisabled: {
    backgroundColor: theme.colors.surfaceCard,
    opacity: 0.6,
  },
  timeDropdownValue: {
    ...theme.typography.bodyLg,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  timeDropdownValueDisabled: {
    color: theme.colors.ash,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginVertical: theme.spacing.md,
  },
  overnightBadge: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopColor: theme.colors.hairline,
    borderTopWidth: 1,
  },
  overnightText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  dayPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    minWidth: 42,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: theme.colors.accentGreen,
    borderColor: theme.colors.accentGreen,
  },
  dayPillInactive: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
  },
  dayLabel: {
    ...theme.typography.captionSm,
  },
  dayLabelActive: {
    color: '#000000',
    fontWeight: '600',
  },
  dayLabelInactive: {
    color: theme.colors.mute,
    fontWeight: '500',
  },
  dayPillDisabled: {
    opacity: 0.5,
  },
  dayLabelDisabled: {
    color: theme.colors.ash,
  },
});
