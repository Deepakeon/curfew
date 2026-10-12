import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { HARD_LOCKOUT_BANNER_TEXT } from '../services/hardLockout';

interface HardLockoutBannerProps {
  message?: string;
  isAttempt?: boolean;
}

export function HardLockoutBanner({
  message = HARD_LOCKOUT_BANNER_TEXT,
  isAttempt = false,
}: HardLockoutBannerProps) {
  return (
    <View
      style={[styles.container, isAttempt && styles.containerAttempt]}
      testID="hard-lockout-banner"
      accessibilityRole="alert"
    >
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HARD LOCKOUT</Text>
        </View>
        <Text style={styles.title}>Curfew is in progress</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  containerAttempt: {
    borderColor: theme.colors.accentRed,
    backgroundColor: theme.colors.accentRedSoft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  badge: {
    backgroundColor: theme.colors.accentRedSoft,
    borderColor: theme.colors.accentRed,
    borderWidth: 1,
    borderRadius: theme.rounded.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
  },
  badgeText: {
    ...theme.typography.captionSm,
    color: theme.colors.accentRed,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
  },
  message: {
    ...theme.typography.bodySm,
    color: theme.colors.body,
    lineHeight: 20,
  },
});
