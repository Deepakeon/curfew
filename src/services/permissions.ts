import { NativeModules, Platform } from 'react-native';

export interface RawPermissions {
  usageAccess?: boolean;
  accessibility?: boolean;
  overlay: boolean;
  batteryIgnored: boolean;
}

export interface PermissionsState {
  usageAccess?: boolean;
  accessibility?: boolean;
  overlay: boolean;
  batteryIgnored: boolean;
  allGranted: boolean;
}

export interface PermissionsDriver {
  checkPermissions(): Promise<PermissionsState>;
  checkPermissionsSync?(): PermissionsState;
  openUsageAccessSettings(): Promise<void>;
  openAccessibilitySettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  openAppInfoSettings(): Promise<void>;
}

export function computePermissionsState(raw: RawPermissions): PermissionsState {
  const usageAccess = Boolean(raw.usageAccess ?? raw.accessibility);
  const overlay = Boolean(raw.overlay);
  const batteryIgnored = Boolean(raw.batteryIgnored);
  const allGranted = Boolean(usageAccess && overlay && batteryIgnored);
  return {
    usageAccess,
    accessibility: usageAccess,
    overlay,
    batteryIgnored,
    allGranted,
  };
}

const { CurfewPermissions } = NativeModules;

export const defaultPermissionsDriver: PermissionsDriver = {
  checkPermissionsSync(): PermissionsState {
    if (Platform.OS !== 'android' || !CurfewPermissions?.checkPermissionsSync) {
      return {
        usageAccess: false,
        accessibility: false,
        overlay: false,
        batteryIgnored: false,
        allGranted: false,
      };
    }
    try {
      const result = CurfewPermissions.checkPermissionsSync();
      return computePermissionsState(result);
    } catch {
      return {
        usageAccess: false,
        accessibility: false,
        overlay: false,
        batteryIgnored: false,
        allGranted: false,
      };
    }
  },

  async checkPermissions(): Promise<PermissionsState> {
    if (Platform.OS !== 'android' || !CurfewPermissions?.checkPermissions) {
      return {
        usageAccess: false,
        accessibility: false,
        overlay: false,
        batteryIgnored: false,
        allGranted: false,
      };
    }
    const result = await CurfewPermissions.checkPermissions();
    return computePermissionsState(result);
  },

  async openUsageAccessSettings(): Promise<void> {
    if (CurfewPermissions?.openUsageAccessSettings) {
      await CurfewPermissions.openUsageAccessSettings();
    } else if (CurfewPermissions?.openAccessibilitySettings) {
      await CurfewPermissions.openAccessibilitySettings();
    }
  },

  async openAccessibilitySettings(): Promise<void> {
    return this.openUsageAccessSettings();
  },

  async openOverlaySettings(): Promise<void> {
    if (CurfewPermissions?.openOverlaySettings) {
      await CurfewPermissions.openOverlaySettings();
    }
  },

  async openBatteryOptimizationSettings(): Promise<void> {
    if (CurfewPermissions?.openBatteryOptimizationSettings) {
      await CurfewPermissions.openBatteryOptimizationSettings();
    }
  },

  async openAppInfoSettings(): Promise<void> {
    if (CurfewPermissions?.openAppInfoSettings) {
      await CurfewPermissions.openAppInfoSettings();
    }
  },
};
