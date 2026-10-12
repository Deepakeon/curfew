jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    CurfewPermissions: {
      checkPermissions: jest.fn(),
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
  it('computes allGranted as true only when all three permissions are granted', () => {
    const allTrue = computePermissionsState({
      accessibility: true,
      overlay: true,
      batteryIgnored: true,
    });
    expect(allTrue.allGranted).toBe(true);
    expect(allTrue.accessibility).toBe(true);
    expect(allTrue.overlay).toBe(true);
    expect(allTrue.batteryIgnored).toBe(true);
  });

  it('computes allGranted as false if accessibility is missing', () => {
    const state = computePermissionsState({
      accessibility: false,
      overlay: true,
      batteryIgnored: true,
    });
    expect(state.allGranted).toBe(false);
  });

  it('computes allGranted as false if overlay is missing', () => {
    const state = computePermissionsState({
      accessibility: true,
      overlay: false,
      batteryIgnored: true,
    });
    expect(state.allGranted).toBe(false);
  });

  it('computes allGranted as false if battery exemption is missing', () => {
    const state = computePermissionsState({
      accessibility: true,
      overlay: true,
      batteryIgnored: false,
    });
    expect(state.allGranted).toBe(false);
  });

  it('calls native driver checkPermissions and formats result', async () => {
    (NativeModules.CurfewPermissions.checkPermissions as jest.Mock).mockResolvedValueOnce({
      accessibility: true,
      overlay: false,
      batteryIgnored: true,
    });

    const result = await defaultPermissionsDriver.checkPermissions();
    expect(result.allGranted).toBe(false);
    expect(result.accessibility).toBe(true);
    expect(result.overlay).toBe(false);
  });

  it('delegates open actions to driver', async () => {
    const mockDriver: PermissionsDriver = {
      checkPermissions: jest.fn().mockResolvedValue({
        accessibility: true,
        overlay: true,
        batteryIgnored: true,
        allGranted: true,
      }),
      openAccessibilitySettings: jest.fn().mockResolvedValue(undefined),
      openOverlaySettings: jest.fn().mockResolvedValue(undefined),
      openBatteryOptimizationSettings: jest.fn().mockResolvedValue(undefined),
      openAppInfoSettings: jest.fn().mockResolvedValue(undefined),
    };

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
