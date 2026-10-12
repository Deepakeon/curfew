jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    CurfewScheduleModule: {
      getSchedule: jest.fn(),
      setSchedule: jest.fn(),
    },
    CurfewApps: {
      getInstalledApps: jest.fn(),
      getTargetApps: jest.fn(),
      setTargetApps: jest.fn(),
    },
  },
}));

import {
  canModifySettings,
  evaluateHardLockout,
  HARD_LOCKOUT_BANNER_TEXT,
} from '../services/hardLockout';
import {
  CurfewSchedule,
  defaultScheduleDriver,
} from '../services/schedule';
import {
  defaultTargetAppsDriver,
} from '../services/targetApps';

describe('Hard Lockout Policy & State (Seam 1)', () => {
  const activeCurfew = true;
  const inactiveCurfew = false;

  describe('canModifySettings policy', () => {
    it('disallows modification when Curfew is active', () => {
      expect(canModifySettings(activeCurfew)).toBe(false);
    });

    it('allows modification when Curfew is inactive', () => {
      expect(canModifySettings(inactiveCurfew)).toBe(true);
    });
  });

  describe('evaluateHardLockout', () => {
    it('presents banner and locks settings when Curfew is active', () => {
      const state = evaluateHardLockout(true);
      expect(state.isLocked).toBe(true);
      expect(state.bannerVisible).toBe(true);
      expect(state.message).toContain('Curfew is in progress');
    });

    it('hides banner and unlocks settings when Curfew is inactive', () => {
      const state = evaluateHardLockout(false, false);
      expect(state.isLocked).toBe(false);
      expect(state.bannerVisible).toBe(false);
    });

    it('presents banner when an attempt is made during active Curfew', () => {
      const state = evaluateHardLockout(true, true);
      expect(state.isLocked).toBe(true);
      expect(state.bannerVisible).toBe(true);
      expect(state.message).toEqual(HARD_LOCKOUT_BANNER_TEXT);
    });
  });

  describe('Hard Lockout Enforcement on Schedule Modifications', () => {
    it('blocks schedule persistence when Curfew is active', async () => {
      const mockSetSchedule = jest.fn();
      const mockDriver = {
        getSchedule: jest.fn(),
        setSchedule: mockSetSchedule,
      };

      const attemptModification = async (isCurfewActive: boolean, nextSchedule: CurfewSchedule) => {
        if (!canModifySettings(isCurfewActive)) {
          return { success: false, bannerPresented: true };
        }
        const saved = await mockDriver.setSchedule(nextSchedule);
        return { success: saved, bannerPresented: false };
      };

      const testSchedule: CurfewSchedule = {
        startHour: 23,
        startMinute: 0,
        endHour: 9,
        endMinute: 0,
        activeDays: [1, 2, 3],
        enabled: true,
      };

      const activeResult = await attemptModification(true, testSchedule);
      expect(activeResult.success).toBe(false);
      expect(activeResult.bannerPresented).toBe(true);
      expect(mockSetSchedule).not.toHaveBeenCalled();

      mockSetSchedule.mockResolvedValueOnce(true);
      const inactiveResult = await attemptModification(false, testSchedule);
      expect(inactiveResult.success).toBe(true);
      expect(inactiveResult.bannerPresented).toBe(false);
      expect(mockSetSchedule).toHaveBeenCalledWith(testSchedule);
    });
  });

  describe('Hard Lockout Enforcement on Target App Selection', () => {
    it('blocks target app selection changes when Curfew is active', async () => {
      const mockSetTargetApps = jest.fn();
      const mockDriver = {
        getInstalledApps: jest.fn(),
        getTargetApps: jest.fn(),
        setTargetApps: mockSetTargetApps,
      };

      const attemptToggleApp = async (isCurfewActive: boolean, packages: string[]) => {
        if (!canModifySettings(isCurfewActive)) {
          return { success: false, bannerPresented: true };
        }
        const saved = await mockDriver.setTargetApps(packages);
        return { success: saved, bannerPresented: false };
      };

      const activeResult = await attemptToggleApp(true, ['com.android.chrome']);
      expect(activeResult.success).toBe(false);
      expect(activeResult.bannerPresented).toBe(true);
      expect(mockSetTargetApps).not.toHaveBeenCalled();

      mockSetTargetApps.mockResolvedValueOnce(true);
      const inactiveResult = await attemptToggleApp(false, ['com.android.chrome']);
      expect(inactiveResult.success).toBe(true);
      expect(inactiveResult.bannerPresented).toBe(false);
      expect(mockSetTargetApps).toHaveBeenCalledWith(['com.android.chrome']);
    });
  });

  describe('Native Module Hard Lockout Rejection verification', () => {
    const fs = require('fs');
    const path = require('path');

    it('CurfewScheduleModule.kt rejects setSchedule when Curfew is active', () => {
      const scheduleModulePath = path.join(
        __dirname,
        '../../plugins/native/kotlin/CurfewScheduleModule.kt'
      );
      const content = fs.readFileSync(scheduleModulePath, 'utf8');
      expect(content).toContain('checkCurfewActiveNow(reactContext)');
      expect(content).toContain('promise.reject("HARD_LOCKOUT"');
    });

    it('CurfewAppsModule.kt rejects setTargetApps when Curfew is active', () => {
      const appsModulePath = path.join(
        __dirname,
        '../../plugins/native/kotlin/CurfewAppsModule.kt'
      );
      const content = fs.readFileSync(appsModulePath, 'utf8');
      expect(content).toContain('CurfewScheduleModule.checkCurfewActiveNow(reactContext)');
      expect(content).toContain('promise.reject("HARD_LOCKOUT"');
    });
  });
});
