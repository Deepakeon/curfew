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
            Offline screen-time enforcement. Target apps are locked during scheduled curfew windows.
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.hero,
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
    ...theme.typography.caption,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.title,
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
  },
  cardBody: {
    ...theme.typography.body,
    color: theme.colors.body,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metaLabel: {
    ...theme.typography.caption,
    color: theme.colors.mute,
  },
  metaValue: {
    ...theme.typography.caption,
    color: theme.colors.ink,
    fontWeight: '500',
  },
});
