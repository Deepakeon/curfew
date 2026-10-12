import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { theme } from '../theme';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionCard } from './PermissionCard';
import { RestrictedSettingsModal } from './RestrictedSettingsModal';

export function OnboardingWizard() {
  const {
    permissions,
    openAccessibility,
    openOverlay,
    openBatteryOptimization,
    openAppInfo,
  } = usePermissions();

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, permissions.allGranted ? styles.bannerReady : styles.bannerPending]}>
        <View style={styles.bannerHeader}>
          <View style={[styles.statusDot, permissions.allGranted ? styles.dotReady : styles.dotPending]} />
          <Text style={[styles.bannerTitle, permissions.allGranted ? styles.titleReady : styles.titlePending]}>
            {permissions.allGranted ? 'Curfew Engine Armed' : 'Setup Required'}
          </Text>
        </View>
        <Text style={styles.bannerSubtitle}>
          {permissions.allGranted
            ? 'All required system permissions are active. Curfew can enforce schedules reliably.'
            : 'Grant permissions below to enable offline app detection, overlay blocking, and process survival.'}
        </Text>
      </View>

      <Text style={styles.sectionHeader}>System Permissions</Text>

      <PermissionCard
        title="Accessibility Service"
        description="Detects when Target Apps launch in foreground to intercept them offline."
        granted={permissions.accessibility}
        onGrant={openAccessibility}
        onHelpPress={() => setModalVisible(true)}
      />

      <PermissionCard
        title="Display Over Other Apps"
        description="Draws the native Curfew countdown overlay window when a Target App is opened."
        granted={permissions.overlay}
        onGrant={openOverlay}
      />

      <PermissionCard
        title="Ignore Battery Optimizations"
        description="Prevents aggressive OEM background cleaners from terminating Curfew services overnight."
        granted={permissions.batteryIgnored}
        onGrant={openBatteryOptimization}
      />

      <RestrictedSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOpenAppInfo={openAppInfo}
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
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  bannerReady: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accentGreen,
  },
  bannerPending: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
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
  dotReady: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotPending: {
    backgroundColor: theme.colors.accentYellow,
  },
  bannerTitle: {
    ...theme.typography.headingMd,
  },
  titleReady: {
    color: theme.colors.accentGreen,
  },
  titlePending: {
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
  },
});
