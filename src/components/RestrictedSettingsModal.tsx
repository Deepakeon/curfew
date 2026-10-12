import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface RestrictedSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAppInfo: () => void;
}

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
            Android disables Accessibility by default on sideloaded apps. Follow these steps to unblock:
          </Text>

          <View style={styles.stepContainer}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Tap <Text style={styles.highlight}>Open App Info</Text> below to go to Curfew system settings.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                In the top-right corner, tap the <Text style={styles.highlight}>three dots (⋮)</Text>.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Select <Text style={styles.highlight}>Allow restricted settings</Text> and verify with your PIN or fingerprint.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Return here and tap <Text style={styles.highlight}>Grant Permission</Text> to enable Accessibility.
              </Text>
            </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    marginBottom: theme.spacing.sm,
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
    color: theme.colors.accentBlue,
    fontWeight: '600',
  },
  stepText: {
    ...theme.typography.bodySm,
    color: theme.colors.body,
    flex: 1,
  },
  highlight: {
    color: theme.colors.ink,
    fontWeight: '600',
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
