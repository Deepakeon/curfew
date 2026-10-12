import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme } from './src/theme';
import { OnboardingWizard } from './src/components/OnboardingWizard';
import { usePermissions } from './src/hooks/usePermissions';

export default function App() {
  const { permissions } = usePermissions();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Curfew</Text>
          <TouchableOpacity
            style={styles.headerBadge}
            onPress={() => setShowSettings(!showSettings)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.headerDot,
                permissions.allGranted ? styles.dotReady : styles.dotPending,
              ]}
            />
            <Text style={styles.badgeText}>
              {permissions.allGranted ? (showSettings ? 'Dashboard' : 'Armed') : 'Setup'}
            </Text>
          </TouchableOpacity>
        </View>

        {!permissions.allGranted || showSettings ? (
          <OnboardingWizard />
        ) : (
          <View style={styles.dashboard}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusDot, styles.dotReady]} />
                <Text style={styles.statusTitle}>Curfew Engine Active</Text>
              </View>
              <Text style={styles.statusBody}>
                All system permissions are granted. Curfew is standing by to enforce schedules.
              </Text>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Accessibility Service</Text>
                <Text style={styles.metaValue}>Connected</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Overlay Permissions</Text>
                <Text style={styles.metaValue}>Active</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Battery Optimization</Text>
                <Text style={styles.metaValue}>Exempted</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowSettings(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.manageButtonText}>Manage Permissions</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.headingXl,
    color: theme.colors.ink,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotReady: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotPending: {
    backgroundColor: theme.colors.accentYellow,
  },
  badgeText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  dashboard: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statusHeader: {
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
  statusTitle: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
  },
  statusBody: {
    ...theme.typography.bodySm,
    color: theme.colors.body,
    marginBottom: theme.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.xxs,
  },
  metaLabel: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
  },
  metaValue: {
    ...theme.typography.captionMd,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  manageButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  manageButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.ink,
  },
});
