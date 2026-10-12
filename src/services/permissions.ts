import { NativeModules, Platform } from 'react-native';

export interface RawPermissions {
  accessibility: boolean;
  overlay: boolean;
  batteryIgnored: boolean;
}

export interface PermissionsState extends RawPermissions {
  allGranted: boolean;
}

export interface PermissionsDriver {
  checkPermissions(): Promise<PermissionsState>;
  openAccessibilitySettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  openAppInfoSettings(): Promise<void>;
}

export function computePermissionsState(raw: RawPermissions): PermissionsState {
  const allGranted = Boolean(raw.accessibility && raw.overlay && raw.batteryIgnored);
  return {
    accessibility: Boolean(raw.accessibility),
    overlay: Boolean(raw.overlay),
    batteryIgnored: Boolean(raw.batteryIgnored),
    allGranted,
  };
}

const { CurfewPermissions } = NativeModules;

export const defaultPermissionsDriver: PermissionsDriver = {
  async checkPermissions(): Promise<PermissionsState> {
    if (Platform.OS !== 'android' || !CurfewPermissions?.checkPermissions) {
      return {
        accessibility: false,
        overlay: false,
        batteryIgnored: false,
        allGranted: false,
      };
    }
    const result = await CurfewPermissions.checkPermissions();
    return computePermissionsState(result);
  },

  async openAccessibilitySettings(): Promise<void> {
    if (CurfewPermissions?.openAccessibilitySettings) {
      await CurfewPermissions.openAccessibilitySettings();
    }
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
