import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { theme } from './src/theme';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Curfew</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Standby</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Digital Curfew</Text>
          <Text style={styles.cardBody}>
            Offline screen-time enforcement. Target Apps are restricted during scheduled Curfew Windows.
          </Text>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Design System</Text>
            <Text style={styles.metaValue}>Raycast Dark</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Engine</Text>
            <Text style={styles.metaValue}>Accessibility + Overlay</Text>
          </View>
        </View>
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
    paddingTop: theme.spacing.xl,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accentGreen,
    marginRight: 6,
  },
  statusText: {
    ...theme.typography.captionSm,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
  },
  cardBody: {
    ...theme.typography.bodyMd,
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
});
