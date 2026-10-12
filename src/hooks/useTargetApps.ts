import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  InstalledApp,
  TargetAppsDriver,
  defaultTargetAppsDriver,
  filterApps,
  toggleTargetPackage,
} from '../services/targetApps';

export function useTargetApps(driver: TargetAppsDriver = defaultTargetAppsDriver) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [targetPackages, setTargetPackages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installed, selected] = await Promise.all([
        driver.getInstalledApps(),
        driver.getTargetApps(),
      ]);
      setApps(installed);
      setTargetPackages(selected);
    } catch {
      // Keep empty defaults
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleApp = useCallback(
    async (packageName: string) => {
      const nextTargets = toggleTargetPackage(targetPackages, packageName);
      setTargetPackages(nextTargets);
      try {
        await driver.setTargetApps(nextTargets);
      } catch {
        // Rollback on failure if needed
      }
    },
    [targetPackages, driver]
  );

  const filteredApps = useMemo(() => {
    return filterApps(apps, searchQuery);
  }, [apps, searchQuery]);

  const targetSet = useMemo(() => {
    return new Set(targetPackages);
  }, [targetPackages]);

  return {
    apps: filteredApps,
    allAppsCount: apps.length,
    targetPackages,
    targetSet,
    searchQuery,
    setSearchQuery,
    toggleApp,
    loading,
    refresh: loadData,
  };
}
