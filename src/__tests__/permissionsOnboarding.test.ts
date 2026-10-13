const mockNativeModules = {
  CurfewPermissions: {
    checkPermissions: jest.fn(),
    checkPermissionsSync: jest.fn(),
    openAccessibilitySettings: jest.fn(),
    openOverlaySettings: jest.fn(),
    openBatteryOptimizationSettings: jest.fn(),
    openAppInfoSettings: jest.fn(),
  },
};

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: mockNativeModules,
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

import { defaultPermissionsDriver, PermissionsState } from '../services/permissions';
import { resolveActiveTab, ActiveTab } from '../utils/navigation';

describe('Permissions Onboarding & Cold Start Persistence (Issue #14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveActiveTab', () => {
    const grantedState: PermissionsState = {
      accessibility: true,
      overlay: true,
      batteryIgnored: true,
      allGranted: true,
    };

    const missingState: PermissionsState = {
      accessibility: false,
      overlay: false,
      batteryIgnored: false,
      allGranted: false,
    };

    it('defaults to "schedule" on cold start when permissions are already granted', () => {
      const tab = resolveActiveTab({
        permissions: grantedState,
        userSelectedTab: null,
      });
      expect(tab).toBe('schedule');
    });

    it('defaults to "setup" on cold start when permissions are missing', () => {
      const tab = resolveActiveTab({
        permissions: missingState,
        userSelectedTab: null,
      });
      expect(tab).toBe('setup');
    });

    it('transitions to "schedule" when permissions become all granted and no tab was manually locked', () => {
      const initialTab = resolveActiveTab({
        permissions: missingState,
        userSelectedTab: null,
      });
      expect(initialTab).toBe('setup');

      const updatedTab = resolveActiveTab({
        permissions: grantedState,
        userSelectedTab: null,
      });
      expect(updatedTab).toBe('schedule');
    });

    it('respects explicit user tab selection', () => {
      const appsTab = resolveActiveTab({
        permissions: grantedState,
        userSelectedTab: 'apps',
      });
      expect(appsTab).toBe('apps');

      const setupTab = resolveActiveTab({
        permissions: grantedState,
        userSelectedTab: 'setup',
      });
      expect(setupTab).toBe('setup');
    });
  });

  describe('Synchronous Permission Checking', () => {
    it('returns synchronous permissions state via checkPermissionsSync', () => {
      mockNativeModules.CurfewPermissions.checkPermissionsSync.mockReturnValueOnce({
        accessibility: true,
        overlay: true,
        batteryIgnored: true,
      });

      const result = defaultPermissionsDriver.checkPermissionsSync?.();
      expect(mockNativeModules.CurfewPermissions.checkPermissionsSync).toHaveBeenCalledTimes(1);
      expect(result?.allGranted).toBe(true);
      expect(result?.accessibility).toBe(true);
      expect(result?.overlay).toBe(true);
      expect(result?.batteryIgnored).toBe(true);
    });

    it('falls back safely if checkPermissionsSync throws', () => {
      mockNativeModules.CurfewPermissions.checkPermissionsSync.mockImplementationOnce(() => {
        throw new Error('Native sync error');
      });

      const result = defaultPermissionsDriver.checkPermissionsSync?.();
      expect(result?.allGranted).toBe(false);
    });
  });
});
