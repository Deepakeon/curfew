import React from 'react';
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
import { theme } from '../theme';
import { useTargetApps } from '../hooks/useTargetApps';
import { InstalledApp } from '../services/targetApps';

export function AppSelectionList() {
  const {
    apps,
    allAppsCount,
    targetSet,
    searchQuery,
    setSearchQuery,
    toggleApp,
    loading,
  } = useTargetApps();

  const renderAppItem = ({ item }: { item: InstalledApp }) => {
    const isTarget = targetSet.has(item.packageName);
    const hasIcon = item.icon && item.icon.length > 0;

    return (
      <TouchableOpacity
        style={[styles.appItem, isTarget && styles.appItemTarget]}
        onPress={() => toggleApp(item.packageName)}
        activeOpacity={0.7}
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

        <View style={[styles.toggleBadge, isTarget ? styles.badgeRestricted : styles.badgeAllowed]}>
          <View style={[styles.toggleDot, isTarget ? styles.dotRestricted : styles.dotAllowed]} />
          <Text style={styles.toggleText}>
            {isTarget ? 'Restricted' : 'Allowed'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Target Apps</Text>
          <Text style={styles.subtitle}>
            Select installed apps to lock during Curfew Windows.
          </Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {targetSet.size} of {allAppsCount} Selected
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps by name or package..."
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
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Scanning installed apps...</Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(item) => item.packageName}
          renderItem={renderAppItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 ? 'No matching apps found.' : 'No installed launcher apps detected.'}
              </Text>
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
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.headingLg,
    color: theme.colors.ink,
  },
  subtitle: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
    marginTop: 2,
  },
  counterBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  counterText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.ink,
    paddingVertical: theme.spacing.sm + 2,
  },
  clearButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  clearButtonText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
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
  appLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.sm,
    backgroundColor: theme.colors.surfaceElevated,
  },
  appIconFallback: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.sm,
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
    ...theme.typography.bodyMd,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  appPackage: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    marginTop: 1,
  },
  toggleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
  },
  badgeRestricted: {
    borderColor: theme.colors.hairlineStrong,
  },
  badgeAllowed: {
    borderColor: theme.colors.hairline,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotRestricted: {
    backgroundColor: theme.colors.accentRed,
  },
  dotAllowed: {
    backgroundColor: theme.colors.ash,
  },
  toggleText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.mute,
  },
});
