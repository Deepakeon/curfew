jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {},
}));

import {
  isCurfewActive,
  CurfewSchedule,
} from '../services/schedule';

describe('Accessibility Interception & System Overlay Policy', () => {
  const activeSchedule: CurfewSchedule = {
    startHour: 22,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    activeDays: [1, 2, 3, 4, 5, 6, 7],
    enabled: true,
  };

  const targetPackages = new Set(['com.android.chrome', 'com.google.android.youtube']);
  const protectedPackages = new Set([
    'com.curfew',
    'com.android.settings',
    'com.android.packageinstaller',
    'com.google.android.packageinstaller',
    'com.android.systemui',
    'android',
    'com.google.android.apps.nexuslauncher',
  ]);

  function shouldInterceptPackage(
    pkg: string,
    schedule: CurfewSchedule,
    targets: Set<string>,
    currentTime: Date
  ): boolean {
    if (protectedPackages.has(pkg)) {
      return false;
    }
    const curfewActive = isCurfewActive(schedule, currentTime);
    return curfewActive && targets.has(pkg);
  }

  it('triggers interception for target apps during active curfew', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    expect(shouldInterceptPackage('com.android.chrome', activeSchedule, targetPackages, activeTime)).toBe(true);
    expect(shouldInterceptPackage('com.google.android.youtube', activeSchedule, targetPackages, activeTime)).toBe(true);
  });

  it('does not intercept target apps outside active curfew', () => {
    const inactiveTime = new Date('2026-10-12T14:00:00');
    expect(shouldInterceptPackage('com.android.chrome', activeSchedule, targetPackages, inactiveTime)).toBe(false);
  });

  it('never intercepts protected packages even during active curfew (Uninstall Escape Hatch)', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    expect(shouldInterceptPackage('com.curfew', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.android.settings', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.android.packageinstaller', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.google.android.packageinstaller', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.android.systemui', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('android', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.google.android.apps.nexuslauncher', activeSchedule, targetPackages, activeTime)).toBe(false);
  });

  it('never intercepts non-target launcher apps (e.g. Phone, Camera)', () => {
    const activeTime = new Date('2026-10-12T23:00:00');
    expect(shouldInterceptPackage('com.google.android.dialer', activeSchedule, targetPackages, activeTime)).toBe(false);
    expect(shouldInterceptPackage('com.google.android.GoogleCamera', activeSchedule, targetPackages, activeTime)).toBe(false);
  });
});
