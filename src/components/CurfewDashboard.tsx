import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useCurfewSchedule } from '../hooks/useCurfewSchedule';
import { useTargetApps } from '../hooks/useTargetApps';
import { InstalledApp } from '../services/targetApps';
import { formatTime, isOvernightWindow } from '../services/schedule';
import { canModifySettings } from '../services/hardLockout';
import { HardLockoutBanner } from './HardLockoutBanner';
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

interface CurfewDashboardProps {
  isCurfewActive?: boolean;
}

export function CurfewDashboard({ isCurfewActive: propIsActive }: CurfewDashboardProps = {}) {
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

  const {
    apps,
    allAppsCount,
    targetSet,
    searchQuery,
    setSearchQuery,
    toggleApp,
    loading,
  } = useTargetApps();

  // Mode: false = show locked apps (default), true = show not-locked apps to add
  const [isLockingApps, setIsLockingApps] = useState(false);

  const handleAttemptChange = () => {
    setLockoutAttempted(true);
  };

  const isOvernight = isOvernightWindow(schedule);

  const daysSummary =
    schedule.activeDays.length === 7
      ? 'Every day'
      : schedule.activeDays.length === 5 &&
        !schedule.activeDays.includes(6) &&
        !schedule.activeDays.includes(7)
      ? 'Weekdays'
      : schedule.activeDays.length === 2 &&
        schedule.activeDays.includes(6) &&
        schedule.activeDays.includes(7)
      ? 'Weekends'
      : `${schedule.activeDays.length} of 7 days`;

  // By default show only locked apps; when locking apps show only not-locked apps
  const displayedApps = useMemo(() => {
    if (isLockingApps) {
      return apps.filter((app) => !targetSet.has(app.packageName));
    }
    return apps.filter((app) => targetSet.has(app.packageName));
  }, [apps, isLockingApps, targetSet]);

  const renderAppItem = ({ item }: { item: InstalledApp }) => {
    const isTarget = targetSet.has(item.packageName);
    const hasIcon = Boolean(item.icon && item.icon.length > 0);

    return (
      <View style={styles.appRow}>
        <View style={styles.appIconTile}>
          {hasIcon ? (
            <Image
              source={{ uri: `data:image/png;base64,${item.icon}` }}
              style={styles.appIcon}
            />
          ) : (
            <Text style={styles.appIconFallbackText}>
              {item.label.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appTitle} numberOfLines={1}>
            {item.label}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.lockPill,
            isTarget ? styles.lockPillActive : styles.lockPillInactive,
            isLocked && styles.lockPillDisabled,
          ]}
          onPress={() => {
            if (isLocked) {
              handleAttemptChange();
              return;
            }
            toggleApp(item.packageName);
          }}
          activeOpacity={isLocked ? 1 : 0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isTarget, disabled: isLocked }}
          accessibilityLabel={`${item.label}, ${isTarget ? 'curfew locked' : 'unlocked'}`}
        >
          <Ionicons
            name={
              isTarget
                ? 'lock-closed'
                : 'add'
            }
            size={13}
            color={
              isLocked
                ? theme.colors.ash
                : isTarget
                ? theme.colors.accentRed
                : theme.colors.ink
            }
          />
          <Text
            style={[
              styles.lockPillText,
              isTarget ? styles.lockPillTextActive : styles.lockPillTextInactive,
            ]}
          >
            {isTarget ? 'Locked' : 'Lock'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Hard Lockout Banner */}
      {(isLocked || lockoutAttempted) && (
        <HardLockoutBanner
          isAttempt={lockoutAttempted}
          message="Curfew is in progress. Schedule and App modifications are locked until the active Curfew Window ends."
        />
      )}

      {/* Top Header: Title, State & Master Toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Curfew</Text>
          <Text style={styles.headerSubtitle}>
            {schedule.enabled
              ? isActive
                ? `Active until ${transition.targetTimeFormatted}`
                : `Next curfew at ${transition.targetTimeFormatted}`
              : 'Curfew paused'}
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

      {/* Grouped Card: Schedule Window & Repeat */}
      <View style={styles.groupedCard}>
        {/* Time Window Row */}
        <View style={styles.cardRow}>
          <View style={styles.rowIconTile}>
            <Ionicons name="time-outline" size={18} color={theme.colors.ink} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Window</Text>
          </View>

          <View style={styles.timeButtonsGroup}>
            <TouchableOpacity
              style={[styles.timeChip, isLocked && styles.timeChipDisabled]}
              onPress={() => {
                if (isLocked) {
                  handleAttemptChange();
                  return;
                }
                setActivePicker('start');
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Starts: ${formatTime(schedule.startHour, schedule.startMinute)}`}
              aria-label={`Starts: ${formatTime(schedule.startHour, schedule.startMinute)}`}
              accessibilityState={{ disabled: isLocked }}
            >
              <Text style={styles.timeChipValue}>
                {formatTime(schedule.startHour, schedule.startMinute)}
              </Text>
            </TouchableOpacity>

            <Ionicons name="arrow-forward" size={12} color={theme.colors.ash} />

            <TouchableOpacity
              style={[styles.timeChip, isLocked && styles.timeChipDisabled]}
              onPress={() => {
                if (isLocked) {
                  handleAttemptChange();
                  return;
                }
                setActivePicker('end');
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Ends: ${formatTime(schedule.endHour, schedule.endMinute)}`}
              aria-label={`Ends: ${formatTime(schedule.endHour, schedule.endMinute)}`}
              accessibilityState={{ disabled: isLocked }}
            >
              <Text style={styles.timeChipValue}>
                {formatTime(schedule.endHour, schedule.endMinute)}
              </Text>
              {isOvernight && <Text style={styles.tagOvernight}>+1d</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Days of Week Row */}
        <View style={styles.cardRowDays}>
          <View style={styles.daysHeader}>
            <View style={styles.daysTitleRow}>
              <View style={styles.rowIconTile}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.ink} />
              </View>
              <Text style={styles.rowTitle}>Repeat</Text>
            </View>
            <Text style={styles.daysSummaryBadge}>{daysSummary}</Text>
          </View>

          <View style={styles.daysPillGrid}>
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
                    {day.label.charAt(0)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Target Apps Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>
          {isLockingApps
            ? `Available Apps (${allAppsCount - targetSet.size})`
            : `Locked Apps (${targetSet.size})`}
        </Text>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isLockingApps ? styles.actionButtonDone : styles.actionButtonAdd,
          ]}
          onPress={() => {
            setIsLockingApps((prev) => !prev);
            setSearchQuery('');
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isLockingApps ? 'Done selecting apps' : 'Lock apps'}
        >
          <Ionicons
            name={isLockingApps ? 'checkmark' : 'add'}
            size={14}
            color={isLockingApps ? theme.colors.onPrimary : theme.colors.onPrimary}
          />
          <Text style={styles.actionButtonText}>
            {isLockingApps ? 'Done' : 'Lock Apps'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input (visible only when browsing available apps to lock) */}
      {isLockingApps && (
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={14}
            color={theme.colors.mute}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps to lock..."
            placeholderTextColor={theme.colors.mute}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={14} color={theme.colors.mute} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedApps}
          keyExtractor={(item) => item.packageName}
          renderItem={renderAppItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={isLockingApps ? 'checkmark-circle-outline' : 'shield-outline'}
                size={24}
                color={theme.colors.ash}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? `No apps matching "${searchQuery}"`
                  : isLockingApps
                  ? 'All installed apps are already locked'
                  : 'No apps locked yet'}
              </Text>
              {!isLockingApps && targetSet.size === 0 ? (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={() => setIsLockingApps(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Lock apps"
                >
                  <Text style={styles.emptyAddButtonText}>+ Lock Apps</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  headerContent: {
    paddingBottom: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  headerLeft: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    marginTop: 2,
  },
  togglePill: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePillActive: {
    borderColor: theme.colors.accentGreen,
    backgroundColor: theme.colors.accentGreenSoft,
  },
  togglePillInactive: {
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
  },
  togglePillDisabled: {
    opacity: 0.6,
    borderColor: theme.colors.hairline,
  },
  groupedCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: theme.rounded.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
  },
  rowIconTile: {
    width: 32,
    height: 32,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    ...theme.typography.buttonMd,
    fontSize: 14,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  timeButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingHorizontal: 10,
    height: 32,
    gap: 4,
  },
  timeChipDisabled: {
    opacity: 0.6,
  },
  timeChipValue: {
    ...theme.typography.buttonMd,
    fontSize: 13,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  tagOvernight: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accentYellow,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.hairlineSoft,
  },
  cardRowDays: {
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
  },
  daysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  daysTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysSummaryBadge: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
  },
  daysPillGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  dayPill: {
    flex: 1,
    height: 30,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: theme.colors.accentGreen,
    borderColor: theme.colors.accentGreen,
  },
  dayPillInactive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
  },
  dayLabel: {
    fontSize: 12,
  },
  dayLabelActive: {
    color: '#000000',
    fontWeight: '700',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.primary,
  },
  actionButtonAdd: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonDone: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    ...theme.typography.buttonMd,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    height: 36,
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    fontSize: 13,
    color: theme.colors.ink,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingVertical: 9,
    paddingHorizontal: theme.spacing.md,
    marginBottom: 6,
  },
  appIconTile: {
    width: 32,
    height: 32,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderColor: theme.colors.hairlineSoft,
    borderWidth: 1,
    overflow: 'hidden',
  },
  appIcon: {
    width: 32,
    height: 32,
  },
  appIconFallbackText: {
    ...theme.typography.buttonMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  appInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  appTitle: {
    ...theme.typography.buttonMd,
    fontSize: 14,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
  },
  lockPillActive: {
    backgroundColor: theme.colors.accentRedSoft,
    borderColor: theme.colors.accentRed,
  },
  lockPillInactive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
  },
  lockPillDisabled: {
    opacity: 0.5,
  },
  lockPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lockPillTextActive: {
    color: theme.colors.accentRed,
  },
  lockPillTextInactive: {
    color: theme.colors.ink,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    textAlign: 'center',
  },
  emptyAddButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.rounded.md,
  },
  emptyAddButtonText: {
    ...theme.typography.buttonMd,
    fontSize: 12,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
});
