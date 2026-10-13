import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionCard } from './PermissionCard';
import { RestrictedSettingsModal } from './RestrictedSettingsModal';
import { PermissionsState } from '../services/permissions';

interface OnboardingWizardProps {
  onAllGranted?: () => void;
  permissions?: PermissionsState;
}

export function OnboardingWizard({
  onAllGranted,
  permissions: customPermissions,
}: OnboardingWizardProps) {
  const {
    permissions: hookPermissions,
    openAccessibility,
    openOverlay,
    openBatteryOptimization,
    openAppInfo,
  } = usePermissions();

  const permissions = customPermissions ?? hookPermissions;
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusBanner}>
        <View style={styles.bannerHeader}>
          <View style={[styles.statusDot, permissions.allGranted ? styles.dotReady : styles.dotPending]} />
          <Text style={styles.bannerTitle}>
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

      {permissions.allGranted && onAllGranted ? (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onAllGranted}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue to Schedule"
        >
          <Text style={styles.continueButtonText}>Continue to Schedule</Text>
        </TouchableOpacity>
      ) : null}
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
  dotReady: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotPending: {
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
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  continueButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.onPrimary,
  },
});
