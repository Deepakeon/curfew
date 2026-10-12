import { NativeModules, Platform } from 'react-native';

export interface InstalledApp {
  packageName: string;
  label: string;
  icon?: string;
}

export interface TargetAppsDriver {
  getInstalledApps(): Promise<InstalledApp[]>;
  getTargetApps(): Promise<string[]>;
  setTargetApps(packages: string[]): Promise<boolean>;
}

export function excludeProtectedPackages(
  apps: InstalledApp[],
  protectedPackages: string[]
): InstalledApp[] {
  const protectedSet = new Set(protectedPackages);
  return apps.filter((app) => !protectedSet.has(app.packageName));
}

export function filterApps(apps: InstalledApp[], query: string): InstalledApp[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return apps;
  }
  return apps.filter(
    (app) =>
      app.label.toLowerCase().includes(trimmed) ||
      app.packageName.toLowerCase().includes(trimmed)
  );
}

export function toggleTargetPackage(
  currentPackages: string[],
  packageToToggle: string
): string[] {
  const set = new Set(currentPackages);
  if (set.has(packageToToggle)) {
    set.delete(packageToToggle);
  } else {
    set.add(packageToToggle);
  }
  return Array.from(set);
}

const { CurfewApps } = NativeModules;

export const defaultTargetAppsDriver: TargetAppsDriver = {
  async getInstalledApps(): Promise<InstalledApp[]> {
    if (Platform.OS !== 'android' || !CurfewApps?.getInstalledApps) {
      return [];
    }
    const apps = await CurfewApps.getInstalledApps();
    return apps || [];
  },

  async getTargetApps(): Promise<string[]> {
    if (Platform.OS !== 'android' || !CurfewApps?.getTargetApps) {
      return [];
    }
    const targetApps = await CurfewApps.getTargetApps();
    return targetApps || [];
  },

  async setTargetApps(packages: string[]): Promise<boolean> {
    if (Platform.OS !== 'android' || !CurfewApps?.setTargetApps) {
      return false;
    }
    return await CurfewApps.setTargetApps(packages);
  },
};
