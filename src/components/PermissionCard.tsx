import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export interface PermissionCardProps {
  title: string;
  description: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  granted: boolean;
  onGrant: () => void;
  onHelpPress?: () => void;
  isLast?: boolean;
}

export function PermissionCard({
  title,
  description,
  subtitle,
  icon,
  granted,
  onGrant,
  onHelpPress,
  isLast = false,
}: PermissionCardProps) {
  return (
    <View style={[styles.container, !isLast && styles.withDivider]}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconTile, granted && styles.iconTileGranted]}>
            <Ionicons
              name={icon}
              size={18}
              color={granted ? theme.colors.accentGreen : theme.colors.ink}
            />
          </View>
        ) : null}

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        </View>

        <View style={styles.actionArea}>
          {onHelpPress && !granted ? (
            <TouchableOpacity
              style={styles.helpButton}
              onPress={onHelpPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Help for ${title}`}
            >
              <Ionicons
                name="help-circle-outline"
                size={18}
                color={theme.colors.mute}
              />
            </TouchableOpacity>
          ) : null}

          {granted ? (
            <View style={styles.grantedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={theme.colors.accentGreen}
              />
              <Text style={styles.grantedText}>Active</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.grantButton}
              onPress={onGrant}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Enable ${title}`}
            >
              <Text style={styles.grantButtonText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  withDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairlineSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: theme.rounded.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  iconTileGranted: {
    backgroundColor: theme.colors.accentGreenSoft,
  },
  info: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    ...theme.typography.buttonMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  subtitle: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
  },
  description: {
    ...theme.typography.captionSm,
    color: theme.colors.body,
  },
  actionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  grantButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.rounded.md,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButtonText: {
    ...theme.typography.buttonMd,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.rounded.full,
    backgroundColor: theme.colors.accentGreenSoft,
  },
  grantedText: {
    ...theme.typography.captionSm,
    fontWeight: '600',
    color: theme.colors.accentGreen,
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: theme.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
