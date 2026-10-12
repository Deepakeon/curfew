import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';
import { useCurfewSchedule } from '../hooks/useCurfewSchedule';
import { formatTime, isOvernightWindow } from '../services/schedule';
import { HardLockoutBanner } from './HardLockoutBanner';
import { canModifySettings } from '../services/hardLockout';

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

interface TimeAdjusterProps {
  label: string;
  hour: number;
  minute: number;
  disabled?: boolean;
  onAdjust: (newHour: number, newMinute: number) => void;
  onAttemptDisabled?: () => void;
}

function TimeAdjuster({
  label,
  hour,
  minute,
  disabled = false,
  onAdjust,
  onAttemptDisabled,
}: TimeAdjusterProps) {
  const adjustHour = (delta: number) => {
    if (disabled) {
      onAttemptDisabled?.();
      return;
    }
    onAdjust((hour + delta + 24) % 24, minute);
  };

  const adjustMinute = (delta: number) => {
    if (disabled) {
      onAttemptDisabled?.();
      return;
    }
    onAdjust(hour, (minute + delta + 60) % 60);
  };

  return (
    <View style={styles.timeSection}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.timeLabel}>{label}</Text>
          <Text style={styles.timeValue}>{formatTime(hour, minute)}</Text>
        </View>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
            onPress={() => adjustHour(-1)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <Text style={[styles.stepperText, disabled && styles.stepperTextDisabled]}>-1h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
            onPress={() => adjustHour(1)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <Text style={[styles.stepperText, disabled && styles.stepperTextDisabled]}>+1h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
            onPress={() => adjustMinute(-15)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <Text style={[styles.stepperText, disabled && styles.stepperTextDisabled]}>-15m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
            onPress={() => adjustMinute(15)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <Text style={[styles.stepperText, disabled && styles.stepperTextDisabled]}>+15m</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <View>
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
          >
            <View
              style={[
                styles.toggleDot,
                schedule.enabled ? styles.dotActive : styles.dotInactive,
                isLocked && styles.toggleDotLocked,
              ]}
            />
            <Text style={[styles.toggleText, isLocked && styles.toggleTextLocked]}>
              {schedule.enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Window Editor */}
      <Text style={styles.sectionHeader}>Curfew Window</Text>

      <View style={styles.card}>
        <TimeAdjuster
          label="Curfew Window starts"
          hour={schedule.startHour}
          minute={schedule.startMinute}
          disabled={isLocked}
          onAdjust={setStartTime}
          onAttemptDisabled={handleAttemptChange}
        />

        <View style={styles.divider} />

        <TimeAdjuster
          label="Curfew Window ends"
          hour={schedule.endHour}
          minute={schedule.endMinute}
          disabled={isLocked}
          onAdjust={setEndTime}
          onAttemptDisabled={handleAttemptChange}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
  },
  togglePillActive: {
    borderColor: theme.colors.hairlineStrong,
  },
  togglePillInactive: {
    borderColor: theme.colors.hairline,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  toggleText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  timeSection: {
    paddingVertical: theme.spacing.xs,
  },
  timeLabel: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
  },
  timeValue: {
    ...theme.typography.headingLg,
    color: theme.colors.ink,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  stepperButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  stepperText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
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
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    minWidth: 42,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairlineStrong,
  },
  dayPillInactive: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
  },
  dayLabel: {
    ...theme.typography.captionSm,
    fontWeight: '500',
  },
  dayLabelActive: {
    color: theme.colors.ink,
  },
  dayLabelInactive: {
    color: theme.colors.mute,
  },
  stepperButtonDisabled: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    opacity: 0.5,
  },
  stepperTextDisabled: {
    color: theme.colors.ash,
  },
  togglePillDisabled: {
    opacity: 0.6,
    borderColor: theme.colors.hairline,
  },
  toggleDotLocked: {
    backgroundColor: theme.colors.ash,
  },
  toggleTextLocked: {
    color: theme.colors.mute,
  },
  dayPillDisabled: {
    opacity: 0.5,
  },
  dayLabelDisabled: {
    color: theme.colors.ash,
  },
});
