jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {},
}));

import { CurfewSchedule } from '../services/schedule';
import {
  shouldInterceptPackage,
  shouldPollUsageStats,
  PROTECTED_PACKAGES,
  CURFEW_PACKAGE,
} from '../services/interception';

describe('Usage Access Interception & Polling Policy', () => {
  it('determines polling should run ONLY when screen is visible and curfew is on', () => {
    expect(shouldPollUsageStats({ isScreenVisible: true, isCurfewActive: true })).toBe(true);
    expect(shouldPollUsageStats({ isScreenVisible: false, isCurfewActive: true })).toBe(false);
    expect(shouldPollUsageStats({ isScreenVisible: true, isCurfewActive: false })).toBe(false);
    expect(shouldPollUsageStats({ isScreenVisible: false, isCurfewActive: false })).toBe(false);
  });
  const activeSchedule: CurfewSchedule = {
    startHour: 22,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    activeDays: [1, 2, 3, 4, 5, 6, 7],
    enabled: true,
  };

  const targetPackages = new Set(['com.android.chrome', 'com.google.android.youtube']);

  it('triggers interception for target apps during active curfew', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    expect(shouldInterceptPackage('com.android.chrome', activeSchedule, targetPackages, activeTime)).toBe(true);
    expect(shouldInterceptPackage('com.google.android.youtube', activeSchedule, targetPackages, activeTime)).toBe(true);
  });

  it('does not intercept target apps outside active curfew', () => {
    const inactiveTime = new Date('2026-10-12T14:00:00');
    expect(shouldInterceptPackage('com.android.chrome', activeSchedule, targetPackages, inactiveTime)).toBe(false);
  });

  it('automatically intercepts Curfew itself during active curfew', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    expect(shouldInterceptPackage(CURFEW_PACKAGE, activeSchedule, targetPackages, activeTime)).toBe(true);
  });

  it('does not intercept Curfew itself outside active curfew', () => {
    const inactiveTime = new Date('2026-10-12T14:00:00');
    expect(shouldInterceptPackage(CURFEW_PACKAGE, activeSchedule, targetPackages, inactiveTime)).toBe(false);
  });

  it('never intercepts protected packages even during active curfew (Uninstall Escape Hatch)', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    for (const pkg of PROTECTED_PACKAGES) {
      expect(shouldInterceptPackage(pkg, activeSchedule, targetPackages, activeTime)).toBe(false);
    }
  });

  it('never intercepts non-target launcher apps (e.g. Phone, Camera)', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    expect(shouldInterceptPackage('com.google.android.dialer', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.google.android.GoogleCamera', activeSchedule, targetPackages, activeTime)).toBe(false);
  });
});
