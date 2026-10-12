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

export function isOvernightWindow(schedule: CurfewSchedule): boolean {
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;
  return startMinutes > endMinutes;
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${displayHour}:${displayMinute} ${period}`;
}

export interface TimeInterval {
  hour: number;
  minute: number;
  formatted: string;
}

export function generate15MinuteIntervals(): TimeInterval[] {
  const intervals: TimeInterval[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      intervals.push({
        hour,
        minute,
        formatted: formatTime(hour, minute),
      });
    }
  }
  return intervals;
}

export function isCurfewActive(schedule: CurfewSchedule, date: Date = new Date()): boolean {
  if (!schedule.enabled || schedule.activeDays.length === 0) {
    return false;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;

  // 0-duration window is inactive
  if (startMinutes === endMinutes) {
    return false;
  }

  const currentDay = getIsoDay(date);
  const prevDay = currentDay === 1 ? 7 : currentDay - 1;

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
    if (isOvernightWindow(schedule) && currentMinutes >= startMinutes) {
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

  // When inactive: find the next active start day and time
  const currentDay = getIsoDay(date);

  // Check if today is active and window hasn't started yet
  if (schedule.activeDays.includes(currentDay) && currentMinutes < startMinutes) {
    return {
      isActive: false,
      minutesRemaining: startMinutes - currentMinutes,
      targetTimeFormatted: formatTime(schedule.startHour, schedule.startMinute),
    };
  }

  // Look ahead across the next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = ((currentDay - 1 + offset) % 7) + 1;
    if (schedule.activeDays.includes(nextDay)) {
      const minutesRemaining =
        24 * 60 - currentMinutes + (offset - 1) * 24 * 60 + startMinutes;
      return {
        isActive: false,
        minutesRemaining,
        targetTimeFormatted: formatTime(schedule.startHour, schedule.startMinute),
      };
    }
  }

  return {
    isActive: false,
    minutesRemaining: 0,
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
