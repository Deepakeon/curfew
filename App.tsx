import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { theme } from './src/theme';
import { OnboardingWizard } from './src/components/OnboardingWizard';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Curfew</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeText}>Setup</Text>
          </View>
        </View>

        <OnboardingWizard />
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
    paddingTop: theme.spacing.lg,
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
  headerBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xxs + 1,
  },
  badgeText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    fontWeight: '500',
  },
});
