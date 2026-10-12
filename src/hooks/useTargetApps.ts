import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  InstalledApp,
  TargetAppsDriver,
  defaultTargetAppsDriver,
  filterApps,
  excludeProtectedPackages,
  toggleTargetPackage,
} from '../services/targetApps';

const PROTECTED_PACKAGES = ['com.curfew'];

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
      const sanitized = excludeProtectedPackages(installed, PROTECTED_PACKAGES);
      setApps(sanitized);
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
      let previousTargets: string[] = [];
      let updatedTargets: string[] = [];

      setTargetPackages((prev) => {
        previousTargets = prev;
        updatedTargets = toggleTargetPackage(prev, packageName);
        return updatedTargets;
      });

      try {
        await driver.setTargetApps(updatedTargets);
      } catch {
        // Rollback state on persistence failure
        setTargetPackages(previousTargets);
      }
    },
    [driver]
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
