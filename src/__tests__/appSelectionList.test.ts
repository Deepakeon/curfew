import { InstalledApp } from '../services/targetApps';

describe('Curfew App Selection Filter Logic', () => {
  const sampleApps: InstalledApp[] = [
    { packageName: 'com.android.chrome', label: 'Google Chrome' },
    { packageName: 'com.google.android.youtube', label: 'YouTube' },
    { packageName: 'com.reddit.frontpage', label: 'Reddit' },
  ];
  const targetSet = new Set(['com.android.chrome']);

  const filterDisplayedApps = (
    apps: InstalledApp[],
    isLockingApps: boolean,
    targets: Set<string>
  ) => {
    if (isLockingApps) {
      return apps.filter((app) => !targets.has(app.packageName));
    }
    return apps.filter((app) => targets.has(app.packageName));
  };

  it('shows only locked apps by default on page', () => {
    const displayed = filterDisplayedApps(sampleApps, false, targetSet);
    expect(displayed).toHaveLength(1);
    expect(displayed[0].packageName).toBe('com.android.chrome');
  });

  it('shows all not-locked apps when lock apps mode is active', () => {
    const displayed = filterDisplayedApps(sampleApps, true, targetSet);
    expect(displayed).toHaveLength(2);
    expect(displayed.map((a) => a.packageName)).toEqual([
      'com.google.android.youtube',
      'com.reddit.frontpage',
    ]);
  });
});
