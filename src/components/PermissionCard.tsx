import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface PermissionCardProps {
  title: string;
  description: string;
  granted: boolean;
  onGrant: () => void;
  onHelpPress?: () => void;
}

export function PermissionCard({
  title,
  description,
  granted,
  onGrant,
  onHelpPress,
}: PermissionCardProps) {
  return (
    <View style={[styles.card, granted && styles.cardGranted]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <View style={[styles.dot, granted ? styles.dotGranted : styles.dotMissing]} />
          <Text style={styles.badgeText}>
            {granted ? 'Active' : 'Missing'}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.actionRow}>
        {!granted ? (
          <TouchableOpacity style={styles.grantButton} onPress={onGrant} activeOpacity={0.8}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readyIndicator}>
            <Text style={styles.readyText}>Configured</Text>
          </View>
        )}

        {onHelpPress && !granted ? (
          <TouchableOpacity style={styles.helpButton} onPress={onHelpPress} activeOpacity={0.7}>
            <Text style={styles.helpButtonText}>Android 13/14 Help</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardGranted: {
    borderColor: theme.colors.hairlineStrong,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotGranted: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotMissing: {
    backgroundColor: theme.colors.accentYellow,
  },
  badgeText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  description: {
    ...theme.typography.bodySm,
    color: theme.colors.body,
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  grantButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.md,
  },
  grantButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.onPrimary,
  },
  helpButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.md,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceElevated,
  },
  helpButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.ink,
  },
  readyIndicator: {
    paddingVertical: theme.spacing.xs,
  },
  readyText: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
  },
});
