import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    openUsageAccess,
    openAccessibility,
    openOverlay,
    openBatteryOptimization,
    openAppInfo,
  } = usePermissions();

  const permissions = customPermissions ?? hookPermissions;
  const [modalVisible, setModalVisible] = useState(false);

  const grantedCount = [
    Boolean(permissions.usageAccess ?? permissions.accessibility),
    Boolean(permissions.overlay),
    Boolean(permissions.batteryIgnored),
  ].filter(Boolean).length;
  const totalCount = 3;
  const isFullyArmed = Boolean(permissions.allGranted) || grantedCount === totalCount;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            
            <Text style={styles.headerSubtitle}>
              {isFullyArmed
                ? 'All systems active. Offline locks ready.'
                : `${grantedCount} of ${totalCount} permissions enabled`}
            </Text>
          </View>

          <View style={styles.progressPills}>
            {[0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.progressPill,
                  idx < grantedCount && styles.progressPillActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.groupedCard}>
        <PermissionCard
          icon="scan-outline"
          title="App Detection"
          subtitle="Usage Access"
          description="Catches target apps when launched"
          granted={Boolean(permissions.usageAccess ?? permissions.accessibility)}
          onGrant={openUsageAccess ?? openAccessibility}
          onHelpPress={() => setModalVisible(true)}
        />

        <PermissionCard
          icon="layers-outline"
          title="Lockout Screen"
          subtitle="Overlay"
          description="Draws blocking timer over apps"
          granted={permissions.overlay}
          onGrant={openOverlay}
        />

        <PermissionCard
          icon="flash-outline"
          title="Keep Alive"
          subtitle="Battery Saver"
          description="Runs reliably throughout the night"
          granted={permissions.batteryIgnored}
          onGrant={openBatteryOptimization}
          isLast
        />
      </View>

      {!(permissions.usageAccess ?? permissions.accessibility) && (
        <TouchableOpacity
          style={styles.helpLink}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open Android 13 and 14 Restricted Settings Guide"
        >
          <Ionicons
            name="help-circle-outline"
            size={15}
            color={theme.colors.mute}
          />
          <Text style={styles.helpLinkText}>
            Toggle greyed out? Android 13/14 Unblock Guide
          </Text>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={theme.colors.ash}
          />
        </TouchableOpacity>
      )}

      <RestrictedSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOpenAppInfo={openAppInfo}
      />

      {isFullyArmed && onAllGranted ? (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onAllGranted}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to Schedule"
        >
          <Text style={styles.continueButtonText}>Continue to Schedule</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.footerNote}>
          <Ionicons
            name="lock-closed-outline"
            size={13}
            color={theme.colors.ash}
          />
          <Text style={styles.footerNoteText}>
            100% offline • No telemetry • Device-local
          </Text>
        </View>
      )}
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
  header: {
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.mute,
    marginTop: 2,
  },
  progressPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressPill: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.surfaceElevated,
  },
  progressPillActive: {
    backgroundColor: theme.colors.accentGreen,
  },
  groupedCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: theme.rounded.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.hairlineSoft,
    marginBottom: theme.spacing.md,
  },
  helpLinkText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    height: 44,
    borderRadius: theme.rounded.md,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  continueButtonText: {
    ...theme.typography.buttonMd,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  footerNoteText: {
    ...theme.typography.captionSm,
    color: theme.colors.ash,
  },
});
