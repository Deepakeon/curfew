import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface RestrictedSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAppInfo: () => void;
}

const RESTRICTED_STEPS = [
  {
    number: 1,
    title: 'Trigger Security Prompt',
    text: 'Attempt to toggle Curfew ON in Accessibility Settings. Android will show a "Restricted setting" prompt.',
  },
  {
    number: 2,
    title: 'Open App Info',
    text: 'Tap "Open App Info" below to navigate directly to Curfew system application settings.',
  },
  {
    number: 3,
    title: 'Unlock Restricted Settings',
    text: 'In the top-right corner, tap the three dots (⋮), select "Allow restricted settings", and verify your PIN.',
  },
  {
    number: 4,
    title: 'Enable Accessibility',
    text: 'Return to Accessibility Settings. The toggle switch will now be unlocked and ready to turn ON.',
  },
];

export function RestrictedSettingsModal({
  visible,
  onClose,
  onOpenAppInfo,
}: RestrictedSettingsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Android 13/14 Restricted Settings</Text>
          <Text style={styles.subtitle}>
            Android disables Accessibility by default on sideloaded APKs. Follow these sequential steps:
          </Text>

          <View style={styles.stepContainer}>
            {RESTRICTED_STEPS.map((step) => (
              <View key={step.number} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                onOpenAppInfo();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Open App Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: theme.rounded.xl,
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.headingLg,
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.mute,
    marginBottom: theme.spacing.lg,
  },
  stepContainer: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: theme.rounded.full,
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepText: {
    ...theme.typography.captionMd,
    color: theme.colors.body,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.rounded.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.rounded.md,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.mute,
  },
});
