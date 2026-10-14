import { CurfewSchedule, isCurfewActive } from './schedule';

export const PROTECTED_PACKAGES: readonly string[] = [
  'com.android.settings',
  'com.android.packageinstaller',
  'com.google.android.packageinstaller',
  'com.android.systemui',
  'android',
  'com.google.android.apps.nexuslauncher',
];

export const CURFEW_PACKAGE = 'com.curfew';

/**
 * Determines whether an application package should be intercepted by Curfew.
 *
 * Rules:
 * 1. Protected packages (Settings, Package Installers, System UI, Home Launcher) are NEVER intercepted (Uninstall Escape Hatch).
 * 2. When Curfew is active:
 *    - Curfew itself is automatically intercepted / blocked.
 *    - Any package in the target packages set is intercepted / blocked.
 * 3. When Curfew is inactive:
 *    - No packages are intercepted.
 */
export function shouldInterceptPackage(
  pkg: string,
  schedule: CurfewSchedule,
  targetPackages: Set<string>,
  currentTime: Date = new Date(),
  protectedPackages: Set<string> = new Set(PROTECTED_PACKAGES)
): boolean {
  if (protectedPackages.has(pkg)) {
    return false;
  }
  const curfewActive = isCurfewActive(schedule, currentTime);
  if (!curfewActive) {
    return false;
  }
  return targetPackages.has(pkg) || pkg === CURFEW_PACKAGE;
}
