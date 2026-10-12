import { NativeModules, Platform } from 'react-native';

export interface CurfewSchedule {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  activeDays: number[]; // 1 = Monday, 7 = Sunday
  enabled: boolean;
}

export interface TransitionInfo {
  isActive: boolean;
  minutesRemaining: number;
  targetTimeFormatted: string;
}

export interface ScheduleDriver {
  getSchedule(): Promise<CurfewSchedule>;
  setSchedule(schedule: CurfewSchedule): Promise<boolean>;
}

export const DEFAULT_SCHEDULE: CurfewSchedule = {
  startHour: 22,
  startMinute: 0,
  endHour: 10,
  endMinute: 0,
  activeDays: [1, 2, 3, 4, 5, 6, 7],
  enabled: true,
};

export function getIsoDay(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${displayHour}:${displayMinute} ${period}`;
}

export function isCurfewActive(schedule: CurfewSchedule, date: Date = new Date()): boolean {
  if (!schedule.enabled || schedule.activeDays.length === 0) {
    return false;
  }

  const currentDay = getIsoDay(date);
  const prevDay = currentDay === 1 ? 7 : currentDay - 1;

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;

  if (startMinutes === endMinutes) {
    return schedule.activeDays.includes(currentDay);
  }

  if (startMinutes < endMinutes) {
    // Same-day window (e.g. 13:00 to 17:00)
    return (
      schedule.activeDays.includes(currentDay) &&
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    );
  }

  // Overnight window (e.g. 22:00 to 10:00)
  const eveningMatch =
    currentMinutes >= startMinutes && schedule.activeDays.includes(currentDay);
  const morningMatch =
    currentMinutes < endMinutes && schedule.activeDays.includes(prevDay);

  return eveningMatch || morningMatch;
}

export function getNextTransition(
  schedule: CurfewSchedule,
  date: Date = new Date()
): TransitionInfo {
  const isActive = isCurfewActive(schedule, date);
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;

  if (isActive) {
    let minutesRemaining = 0;
    if (startMinutes > endMinutes && currentMinutes >= startMinutes) {
      minutesRemaining = 24 * 60 - currentMinutes + endMinutes;
    } else {
      minutesRemaining = endMinutes - currentMinutes;
    }

    return {
      isActive: true,
      minutesRemaining: Math.max(0, minutesRemaining),
      targetTimeFormatted: formatTime(schedule.endHour, schedule.endMinute),
    };
  }

  // Inactive: calculate time until start
  let minutesRemaining = 0;
  if (startMinutes > currentMinutes) {
    minutesRemaining = startMinutes - currentMinutes;
  } else {
    minutesRemaining = 24 * 60 - currentMinutes + startMinutes;
  }

  return {
    isActive: false,
    minutesRemaining: Math.max(0, minutesRemaining),
    targetTimeFormatted: formatTime(schedule.startHour, schedule.startMinute),
  };
}

const { CurfewScheduleModule } = NativeModules;

export const defaultScheduleDriver: ScheduleDriver = {
  async getSchedule(): Promise<CurfewSchedule> {
    if (Platform.OS !== 'android' || !CurfewScheduleModule?.getSchedule) {
      return DEFAULT_SCHEDULE;
    }
    const schedule = await CurfewScheduleModule.getSchedule();
    return schedule || DEFAULT_SCHEDULE;
  },

  async setSchedule(schedule: CurfewSchedule): Promise<boolean> {
    if (Platform.OS !== 'android' || !CurfewScheduleModule?.setSchedule) {
      return false;
    }
    return await CurfewScheduleModule.setSchedule(schedule);
  },
};
