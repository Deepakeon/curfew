import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme } from './src/theme';
import { OnboardingWizard } from './src/components/OnboardingWizard';
import { AppSelectionList } from './src/components/AppSelectionList';
import { usePermissions } from './src/hooks/usePermissions';

type ActiveTab = 'apps' | 'permissions';

export default function App() {
  const { permissions } = usePermissions();
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    permissions.allGranted ? 'apps' : 'permissions'
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Curfew</Text>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabPill, activeTab === 'apps' && styles.tabPillActive]}
              onPress={() => setActiveTab('apps')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'apps' && styles.tabTextActive,
                ]}
              >
                Target Apps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'permissions' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('permissions')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.statusDot,
                  permissions.allGranted ? styles.dotReady : styles.dotPending,
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'permissions' && styles.tabTextActive,
                ]}
              >
                Setup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'apps' ? <AppSelectionList /> : <OnboardingWizard />}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    padding: theme.spacing.xxs,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.full,
  },
  tabPillActive: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairlineStrong,
    borderWidth: 1,
  },
  tabText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.ink,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotReady: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotPending: {
    backgroundColor: theme.colors.accentYellow,
  },
});
