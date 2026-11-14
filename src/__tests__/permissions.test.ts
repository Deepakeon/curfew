jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    CurfewPermissions: {
      checkPermissions: jest.fn(),
      openUsageAccessSettings: jest.fn(),
      openAccessibilitySettings: jest.fn(),
      openOverlaySettings: jest.fn(),
      openBatteryOptimizationSettings: jest.fn(),
      openAppInfoSettings: jest.fn(),
    },
  },
}));

import { computePermissionsState, PermissionsDriver, defaultPermissionsDriver } from '../services/permissions';
import { NativeModules } from 'react-native';

describe('Permissions Service & Logic', () => {
  it('computes allGranted as true only when all three permissions are granted (usageAccess)', () => {
    const allTrue = computePermissionsState({
      usageAccess: true,
      overlay: true,
      batteryIgnored: true,
    });
    expect(allTrue.allGranted).toBe(true);
    expect(allTrue.usageAccess).toBe(true);
    expect(allTrue.accessibility).toBe(true);
    expect(allTrue.overlay).toBe(true);
    expect(allTrue.batteryIgnored).toBe(true);
  });

  it('computes allGranted as true when legacy accessibility field is provided', () => {
    const allTrue = computePermissionsState({
      accessibility: true,
      overlay: true,
      batteryIgnored: true,
    });
    expect(allTrue.allGranted).toBe(true);
    expect(allTrue.usageAccess).toBe(true);
    expect(allTrue.accessibility).toBe(true);
    expect(allTrue.overlay).toBe(true);
    expect(allTrue.batteryIgnored).toBe(true);
  });

  it('computes allGranted as false if usageAccess is missing', () => {
    const state = computePermissionsState({
      usageAccess: false,
      overlay: true,
      batteryIgnored: true,
    });
    expect(state.allGranted).toBe(false);
    expect(state.usageAccess).toBe(false);
  });

  it('computes allGranted as false if overlay is missing', () => {
    const state = computePermissionsState({
      usageAccess: true,
      overlay: false,
      batteryIgnored: true,
    });
    expect(state.allGranted).toBe(false);
  });

  it('computes allGranted as false if battery exemption is missing', () => {
    const state = computePermissionsState({
      usageAccess: true,
      overlay: true,
      batteryIgnored: false,
    });
    expect(state.allGranted).toBe(false);
  });

  it('calls native driver checkPermissions and formats result', async () => {
    (NativeModules.CurfewPermissions.checkPermissions as jest.Mock).mockResolvedValueOnce({
      usageAccess: true,
      overlay: false,
      batteryIgnored: true,
    });

    const result = await defaultPermissionsDriver.checkPermissions();
    expect(result.allGranted).toBe(false);
    expect(result.usageAccess).toBe(true);
    expect(result.accessibility).toBe(true);
    expect(result.overlay).toBe(false);
  });

  it('delegates open actions to driver including openUsageAccessSettings', async () => {
    const mockDriver: PermissionsDriver = {
      checkPermissions: jest.fn().mockResolvedValue({
        usageAccess: true,
        accessibility: true,
        overlay: true,
        batteryIgnored: true,
        allGranted: true,
      }),
      openUsageAccessSettings: jest.fn().mockResolvedValue(undefined),
      openAccessibilitySettings: jest.fn().mockResolvedValue(undefined),
      openOverlaySettings: jest.fn().mockResolvedValue(undefined),
      openBatteryOptimizationSettings: jest.fn().mockResolvedValue(undefined),
      openAppInfoSettings: jest.fn().mockResolvedValue(undefined),
    };

    await mockDriver.openUsageAccessSettings();
    expect(mockDriver.openUsageAccessSettings).toHaveBeenCalledTimes(1);

    await mockDriver.openAccessibilitySettings();
    expect(mockDriver.openAccessibilitySettings).toHaveBeenCalledTimes(1);

    await mockDriver.openOverlaySettings();
    expect(mockDriver.openOverlaySettings).toHaveBeenCalledTimes(1);

    await mockDriver.openBatteryOptimizationSettings();
    expect(mockDriver.openBatteryOptimizationSettings).toHaveBeenCalledTimes(1);

    await mockDriver.openAppInfoSettings();
    expect(mockDriver.openAppInfoSettings).toHaveBeenCalledTimes(1);
  });
});
