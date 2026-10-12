import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CurfewSchedule,
  DEFAULT_SCHEDULE,
  ScheduleDriver,
  defaultScheduleDriver,
  isCurfewActive,
  getNextTransition,
  TransitionInfo,
} from '../services/schedule';

export function useCurfewSchedule(driver: ScheduleDriver = defaultScheduleDriver) {
  const [schedule, setSchedule] = useState<CurfewSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await driver.getSchedule();
      setSchedule(stored);
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Keep live time updated for accurate status
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); // Check every 15s

    return () => clearInterval(timer);
  }, []);

  const save = useCallback(
    async (nextSchedule: CurfewSchedule) => {
      setSchedule(nextSchedule);
      try {
        await driver.setSchedule(nextSchedule);
      } catch {
        // Rollback if needed
      }
    },
    [driver]
  );

  const toggleDay = useCallback(
    (day: number) => {
      const currentDays = new Set(schedule.activeDays);
      if (currentDays.has(day)) {
        currentDays.delete(day);
      } else {
        currentDays.add(day);
      }
      const updated = {
        ...schedule,
        activeDays: Array.from(currentDays).sort((a, b) => a - b),
      };
      save(updated);
    },
    [schedule, save]
  );

  const toggleEnabled = useCallback(() => {
    save({ ...schedule, enabled: !schedule.enabled });
  }, [schedule, save]);

  const setStartTime = useCallback(
    (startHour: number, startMinute: number) => {
      save({ ...schedule, startHour, startMinute });
    },
    [schedule, save]
  );

  const setEndTime = useCallback(
    (endHour: number, endMinute: number) => {
      save({ ...schedule, endHour, endMinute });
    },
    [schedule, save]
  );

  const isActive = useMemo(() => {
    return isCurfewActive(schedule, now);
  }, [schedule, now]);

  const transition = useMemo<TransitionInfo>(() => {
    return getNextTransition(schedule, now);
  }, [schedule, now]);

  return {
    schedule,
    loading,
    isActive,
    transition,
    toggleDay,
    toggleEnabled,
    setStartTime,
    setEndTime,
    saveSchedule: save,
    refresh: loadSchedule,
  };
}
