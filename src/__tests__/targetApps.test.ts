jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    CurfewApps: {
      getInstalledApps: jest.fn(),
      getTargetApps: jest.fn(),
      setTargetApps: jest.fn(),
    },
  },
}));

import {
  filterApps,
  excludeProtectedPackages,
  toggleTargetPackage,
  InstalledApp,
  defaultTargetAppsDriver,
} from '../services/targetApps';
import { NativeModules } from 'react-native';

describe('Target Apps Service & Logic', () => {
  const sampleApps: InstalledApp[] = [
    { packageName: 'com.android.chrome', label: 'Google Chrome' },
    { packageName: 'com.google.android.youtube', label: 'YouTube' },
    { packageName: 'com.reddit.frontpage', label: 'Reddit' },
    { packageName: 'com.curfew', label: 'Curfew' },
    { packageName: 'com.sec.android.app.launcher', label: 'One UI Home' },
  ];

  it('excludes protected packages (Curfew and system launcher)', () => {
    const protectedList = ['com.curfew', 'com.sec.android.app.launcher'];
    const filtered = excludeProtectedPackages(sampleApps, protectedList);

    expect(filtered).toHaveLength(3);
    const packages = filtered.map((a: InstalledApp) => a.packageName);
    expect(packages).not.toContain('com.curfew');
    expect(packages).not.toContain('com.sec.android.app.launcher');
    expect(packages).toContain('com.android.chrome');
    expect(packages).toContain('com.google.android.youtube');
    expect(packages).toContain('com.reddit.frontpage');
  });

  it('filters apps by label or package query case-insensitively', () => {
    expect(filterApps(sampleApps, 'chrome')).toEqual([
      { packageName: 'com.android.chrome', label: 'Google Chrome' },
    ]);

    expect(filterApps(sampleApps, 'REDDIT')).toEqual([
      { packageName: 'com.reddit.frontpage', label: 'Reddit' },
    ]);

    expect(filterApps(sampleApps, 'google')).toHaveLength(2);
    expect(filterApps(sampleApps, '')).toHaveLength(5);
  });

  it('toggles target packages correctly', () => {
    const initial: string[] = ['com.android.chrome'];

    const added = toggleTargetPackage(initial, 'com.google.android.youtube');
    expect(added).toEqual(['com.android.chrome', 'com.google.android.youtube']);

    const removed = toggleTargetPackage(added, 'com.android.chrome');
    expect(removed).toEqual(['com.google.android.youtube']);
  });

  it('interacts with native driver methods', async () => {
    (NativeModules.CurfewApps.getInstalledApps as jest.Mock).mockResolvedValueOnce(sampleApps);
    (NativeModules.CurfewApps.getTargetApps as jest.Mock).mockResolvedValueOnce(['com.android.chrome']);
    (NativeModules.CurfewApps.setTargetApps as jest.Mock).mockResolvedValueOnce(true);

    const installed = await defaultTargetAppsDriver.getInstalledApps();
    expect(installed).toEqual(sampleApps);

    const targets = await defaultTargetAppsDriver.getTargetApps();
    expect(targets).toEqual(['com.android.chrome']);

    const saveResult = await defaultTargetAppsDriver.setTargetApps(['com.reddit.frontpage']);
    expect(saveResult).toBe(true);
  });
});
