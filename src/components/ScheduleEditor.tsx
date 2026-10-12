import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';
import { useCurfewSchedule } from '../hooks/useCurfewSchedule';
import { formatTime } from '../services/schedule';

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

export function ScheduleEditor() {
  const {
    schedule,
    isActive,
    transition,
    toggleDay,
    toggleEnabled,
    setStartTime,
    setEndTime,
  } = useCurfewSchedule();

  const isOvernight =
    schedule.startHour * 60 + schedule.startMinute >
    schedule.endHour * 60 + schedule.endMinute;

  const adjustHour = (currentHour: number, delta: number): number => {
    return (currentHour + delta + 24) % 24;
  };

  const adjustMinute = (currentMinute: number, delta: number): number => {
    return (currentMinute + delta + 60) % 60;
  };

  const hoursRemaining = Math.floor(transition.minutesRemaining / 60);
  const minsRemaining = transition.minutesRemaining % 60;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
              : `Next curfew begins at ${transition.targetTimeFormatted} (${hoursRemaining}h ${minsRemaining}m from now).`
            : 'Schedule is paused. Target apps are unrestricted.'}
        </Text>
      </View>

      {/* Master Enable Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Enforce Schedule</Text>
            <Text style={styles.cardSubtitle}>
              Automatically restrict target apps during curfew
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.togglePill, schedule.enabled ? styles.togglePillActive : styles.togglePillInactive]}
            onPress={toggleEnabled}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleDot, schedule.enabled ? styles.dotActive : styles.dotInactive]} />
            <Text style={styles.toggleText}>{schedule.enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Window Editor */}
      <Text style={styles.sectionHeader}>Curfew Window</Text>

      <View style={styles.card}>
        {/* Start Time */}
        <View style={styles.timeSection}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.timeLabel}>Start Time (Lock begins)</Text>
              <Text style={styles.timeValue}>
                {formatTime(schedule.startHour, schedule.startMinute)}
              </Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setStartTime(adjustHour(schedule.startHour, -1), schedule.startMinute)}
              >
                <Text style={styles.stepperText}>-1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setStartTime(adjustHour(schedule.startHour, 1), schedule.startMinute)}
              >
                <Text style={styles.stepperText}>+1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setStartTime(schedule.startHour, adjustMinute(schedule.startMinute, 15))}
              >
                <Text style={styles.stepperText}>+15m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* End Time */}
        <View style={styles.timeSection}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.timeLabel}>End Time (Lock lifts)</Text>
              <Text style={styles.timeValue}>
                {formatTime(schedule.endHour, schedule.endMinute)}
              </Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setEndTime(adjustHour(schedule.endHour, -1), schedule.endMinute)}
              >
                <Text style={styles.stepperText}>-1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setEndTime(adjustHour(schedule.endHour, 1), schedule.endMinute)}
              >
                <Text style={styles.stepperText}>+1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setEndTime(schedule.endHour, adjustMinute(schedule.endMinute, 15))}
              >
                <Text style={styles.stepperText}>+15m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
          Curfew applies on selected days:
        </Text>
        <View style={styles.daysRow}>
          {DAYS.map((day) => {
            const isDayActive = schedule.activeDays.includes(day.id);
            return (
              <TouchableOpacity
                key={day.id}
                style={[styles.dayPill, isDayActive ? styles.dayPillActive : styles.dayPillInactive]}
                onPress={() => toggleDay(day.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLabel, isDayActive ? styles.dayLabelActive : styles.dayLabelInactive]}>
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
});
