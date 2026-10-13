import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  PermissionsState,
  PermissionsDriver,
  defaultPermissionsDriver,
} from '../services/permissions';

export function usePermissions(driver: PermissionsDriver = defaultPermissionsDriver) {
  const [permissions, setPermissions] = useState<PermissionsState>(() => {
    try {
      if (typeof driver.checkPermissionsSync === 'function') {
        return driver.checkPermissionsSync();
      }
    } catch {
      // Fallback to default state
    }
    return {
      accessibility: false,
      overlay: false,
      batteryIgnored: false,
      allGranted: false,
    };
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      if (typeof driver.checkPermissionsSync === 'function') {
        return false;
      }
    } catch {
      // Fallback to loading
    }
    return true;
  });

  const refresh = useCallback(async () => {
    try {
      const state = await driver.checkPermissions();
      setPermissions(state);
    } catch {
      // Ignore in background checks
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => {
    refresh();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return {
    permissions,
    loading,
    refresh,
    openAccessibility: () => driver.openAccessibilitySettings(),
    openOverlay: () => driver.openOverlaySettings(),
    openBatteryOptimization: () => driver.openBatteryOptimizationSettings(),
    openAppInfo: () => driver.openAppInfoSettings(),
  };
}
