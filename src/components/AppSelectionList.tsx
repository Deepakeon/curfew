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
import { useTargetApps } from '../hooks/useTargetApps';
import { InstalledApp } from '../services/targetApps';
import { HardLockoutBanner } from './HardLockoutBanner';
import { canModifySettings } from '../services/hardLockout';
import { useCurfewSchedule } from '../hooks/useCurfewSchedule';

interface AppSelectionListProps {
  isCurfewActive?: boolean;
}

export function AppSelectionList({ isCurfewActive: propIsActive }: AppSelectionListProps = {}) {
  const { isActive: scheduleIsActive } = useCurfewSchedule();
  const isCurfewActive = propIsActive !== undefined ? propIsActive : scheduleIsActive;
  const isLocked = !canModifySettings(isCurfewActive);
  const [lockoutAttempted, setLockoutAttempted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'locked'>('all');

  const {
    apps,
    allAppsCount,
    targetSet,
    searchQuery,
    setSearchQuery,
    toggleApp,
    loading,
  } = useTargetApps();

  const displayedApps = useMemo(() => {
    if (filter === 'locked') {
      return apps.filter((app) => targetSet.has(app.packageName));
    }
    return apps;
  }, [apps, filter, targetSet]);

  const renderAppItem = ({ item }: { item: InstalledApp }) => {
    const isTarget = targetSet.has(item.packageName);
    const hasIcon = Boolean(item.icon && item.icon.length > 0);

    return (
      <TouchableOpacity
        style={[
          styles.appItem,
          isTarget && styles.appItemTarget,
          isLocked && styles.appItemLocked,
        ]}
        onPress={() => {
          if (isLocked) {
            setLockoutAttempted(true);
            return;
          }
          toggleApp(item.packageName);
        }}
        activeOpacity={isLocked ? 1 : 0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isTarget, disabled: isLocked }}
        accessibilityLabel={`${item.label}, ${isTarget ? 'curfew locked' : 'unlocked'}`}
      >
        <View style={styles.appLeading}>
          {hasIcon ? (
            <Image
              source={{ uri: `data:image/png;base64,${item.icon}` }}
              style={styles.appIcon}
            />
          ) : (
            <View style={styles.appIconFallback}>
              <Text style={styles.appIconFallbackText}>
                {item.label.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.appDetails}>
            <Text style={styles.appLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.appPackage} numberOfLines={1}>
              {item.packageName}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.lockButton,
            isTarget ? styles.lockButtonTarget : styles.lockButtonAllowed,
            isLocked && styles.lockButtonDisabled,
          ]}
        >
          <Ionicons
            name={isTarget ? 'lock-closed' : 'lock-open-outline'}
            size={16}
            color={
              isLocked
                ? theme.colors.ash
                : isTarget
                ? theme.colors.accentRed
                : theme.colors.mute
            }
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {(isLocked || lockoutAttempted) && (
        <HardLockoutBanner
          isAttempt={lockoutAttempted}
          message="Curfew is in progress. Target App selection is locked until the active Curfew Window ends."
        />
      )}

      {/* Header with Title & Locked Count Badge */}
      <View style={styles.header}>
        <Text style={styles.title}>Target Apps</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="lock-closed" size={11} color={theme.colors.accentRed} />
          <Text style={styles.headerBadgeText}>
            {targetSet.size} Locked
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={16}
          color={theme.colors.mute}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={filter === 'locked' ? 'Search locked apps...' : 'Search apps...'}
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
            <Ionicons name="close-circle" size={16} color={theme.colors.mute} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List Filter Options: All vs Locked */}
      <View style={styles.filterRow}>
        <View style={styles.segmentedFilter}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              filter === 'all' && styles.filterOptionActive,
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'all' }}
            accessibilityLabel={`All apps, ${allAppsCount} total`}
          >
            <Text
              style={[
                styles.filterOptionText,
                filter === 'all' && styles.filterOptionTextActive,
              ]}
            >
              All ({allAppsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              filter === 'locked' && styles.filterOptionActiveLocked,
            ]}
            onPress={() => setFilter('locked')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'locked' }}
            accessibilityLabel={`Locked apps, ${targetSet.size} locked`}
          >
            <Ionicons
              name="lock-closed"
              size={12}
              color={
                filter === 'locked' ? theme.colors.accentRed : theme.colors.mute
              }
            />
            <Text
              style={[
                styles.filterOptionText,
                filter === 'locked' && styles.filterOptionTextActiveLocked,
              ]}
            >
              Locked ({targetSet.size})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Scanning apps...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedApps}
          keyExtractor={(item) => item.packageName}
          renderItem={renderAppItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={filter === 'locked' ? 'lock-closed-outline' : 'search-outline'}
                size={28}
                color={theme.colors.ash}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? `No apps matching "${searchQuery}"`
                  : filter === 'locked'
                  ? 'No apps locked yet'
                  : 'No launcher apps found'}
              </Text>
              {filter === 'locked' && searchQuery.length === 0 ? (
                <Text style={styles.emptySubtext}>
                  Tap the lock icon on any app to restrict it during Curfew.
                </Text>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.headingLg,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.accentRedSoft,
    borderColor: theme.colors.accentRed,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  headerBadgeText: {
    ...theme.typography.captionSm,
    color: theme.colors.accentRed,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    height: 42,
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.ink,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  segmentedFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    padding: 3,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairlineStrong,
  },
  filterOptionActiveLocked: {
    backgroundColor: theme.colors.accentRedSoft,
    borderColor: theme.colors.accentRed,
  },
  filterOptionText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: theme.colors.ink,
    fontWeight: '600',
  },
  filterOptionTextActiveLocked: {
    color: theme.colors.accentRed,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  appItemTarget: {
    borderColor: theme.colors.hairlineStrong,
  },
  appItemLocked: {
    opacity: 0.7,
  },
  appLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  appIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceElevated,
  },
  appIconFallback: {
    width: 42,
    height: 42,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: theme.colors.hairline,
    borderWidth: 1,
  },
  appIconFallbackText: {
    ...theme.typography.bodyMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  appDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  appLabel: {
    ...theme.typography.buttonMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  appPackage: {
    ...theme.typography.captionSm,
    color: theme.colors.ash,
    marginTop: 1,
  },
  lockButton: {
    width: 38,
    height: 38,
    borderRadius: theme.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  lockButtonTarget: {
    backgroundColor: theme.colors.accentRedSoft,
    borderColor: theme.colors.accentRed,
  },
  lockButtonAllowed: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
  },
  lockButtonDisabled: {
    opacity: 0.5,
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
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.ink,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    textAlign: 'center',
    marginTop: 4,
  },
});
