import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './src/theme';
import { OnboardingWizard } from './src/components/OnboardingWizard';
import { CurfewDashboard } from './src/components/CurfewDashboard';
import { usePermissions } from './src/hooks/usePermissions';
import { useCurfewSchedule } from './src/hooks/useCurfewSchedule';

import { getAndroidStatusBarHeight } from './src/utils/layout';
import { resolveActiveTab, ActiveTab } from './src/utils/navigation';

export { ActiveTab };

export interface AppProps {
  initialTab?: ActiveTab;
  [key: string]: unknown;
}

export default function App({ initialTab }: AppProps = {}) {
  const { permissions } = usePermissions();
  const { isActive: isCurfewRunning } = useCurfewSchedule();
  const [selectedTab, setSelectedTab] = useState<ActiveTab | null>(
    initialTab ?? null
  );

  const activeTab = resolveActiveTab({
    permissions,
    userSelectedTab: selectedTab,
  });

  const handleTabPress = (tab: ActiveTab) => {
    setSelectedTab(tab);
  };

  const handleAllGranted = () => {
    setSelectedTab('schedule');
  };

  const isSetupActive = activeTab === 'setup';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Persistent Global Header */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Text style={styles.title}>Curfew</Text>
            {isCurfewRunning ? (
              <View
                style={styles.headerStatusBadgeActive}
                accessibilityLabel="Curfew lockout is actively running"
              >
                <View style={[styles.headerStatusDot, styles.dotActive]} />
                <Text style={styles.headerStatusTextActive}>LOCKED</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tabBar} accessibilityRole="tablist">
            <TouchableOpacity
              style={[
                styles.tabPill,
                !isSetupActive && styles.tabPillActive,
              ]}
              onPress={() => handleTabPress('schedule')}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: !isSetupActive }}
              accessibilityLabel="Curfew controls"
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={!isSetupActive ? theme.colors.ink : theme.colors.mute}
              />
              <Text
                style={[
                  styles.tabText,
                  !isSetupActive && styles.tabTextActive,
                ]}
              >
                Curfew
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                isSetupActive && styles.tabPillActive,
              ]}
              onPress={() => handleTabPress('setup')}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSetupActive }}
              accessibilityLabel={`Setup tab, ${permissions.allGranted ? 'all permissions ready' : 'setup required'}`}
            >
              <View
                style={[
                  styles.setupDot,
                  permissions.allGranted ? styles.dotReady : styles.dotPending,
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  isSetupActive && styles.tabTextActive,
                ]}
              >
                Setup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isSetupActive ? (
          <OnboardingWizard
            permissions={permissions}
            onAllGranted={handleAllGranted}
          />
        ) : (
          <CurfewDashboard isCurfewActive={isCurfewRunning} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    paddingTop: getAndroidStatusBarHeight(),
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
    marginBottom: theme.spacing.md,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.headingXl,
    color: theme.colors.ink,
    letterSpacing: -0.5,
  },
  headerStatusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentRedSoft,
    borderColor: theme.colors.accentRed,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotActive: {
    backgroundColor: theme.colors.accentRed,
  },
  headerStatusTextActive: {
    ...theme.typography.captionSm,
    fontSize: 10,
    letterSpacing: 0.5,
    color: theme.colors.accentRed,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.full,
    padding: 3,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 5,
  },
  tabPillActive: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairlineStrong,
  },
  tabText: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.ink,
    fontWeight: '600',
  },
  setupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotReady: {
    backgroundColor: theme.colors.accentGreen,
  },
  dotPending: {
    backgroundColor: theme.colors.accentYellow,
  },
});
