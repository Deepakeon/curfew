jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    CurfewScheduleModule: {
      getSchedule: jest.fn(),
      setSchedule: jest.fn(),
    },
  },
}));

import {
  isCurfewActive,
  formatTime,
  getNextTransition,
  CurfewSchedule,
  defaultScheduleDriver,
} from '../services/schedule';
import { NativeModules } from 'react-native';

describe('Curfew Schedule Domain Logic', () => {
  const defaultOvernightSchedule: CurfewSchedule = {
    startHour: 22,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    activeDays: [1, 2, 3, 4, 5, 6, 7], // Mon to Sun
    enabled: true,
  };

  it('formats time in 12-hour AM/PM format', () => {
    expect(formatTime(22, 0)).toBe('10:00 PM');
    expect(formatTime(10, 0)).toBe('10:00 AM');
    expect(formatTime(0, 30)).toBe('12:30 AM');
    expect(formatTime(12, 15)).toBe('12:15 PM');
  });

  describe('Overnight Curfew (22:00 to 10:00)', () => {
    it('is active late at night (e.g., 23:30)', () => {
      // Wednesday 23:30
      const testDate = new Date(2026, 9, 14, 23, 30); // Wed Oct 14 2026
      expect(isCurfewActive(defaultOvernightSchedule, testDate)).toBe(true);
    });

    it('is active early in the morning before 10:00 AM (e.g., 07:15)', () => {
      // Thursday 07:15
      const testDate = new Date(2026, 9, 15, 7, 15); // Thu Oct 15 2026
      expect(isCurfewActive(defaultOvernightSchedule, testDate)).toBe(true);
    });

    it('is inactive during the day (e.g., 14:00)', () => {
      // Thursday 14:00
      const testDate = new Date(2026, 9, 15, 14, 0); // Thu Oct 15 2026
      expect(isCurfewActive(defaultOvernightSchedule, testDate)).toBe(false);
    });

    it('is inactive when schedule is disabled', () => {
      const disabledSchedule = { ...defaultOvernightSchedule, enabled: false };
      const testDate = new Date(2026, 9, 14, 23, 30);
      expect(isCurfewActive(disabledSchedule, testDate)).toBe(false);
    });
  });

  describe('Day-of-Week Recurrence Filtering', () => {
    // Schedule active ONLY on Friday night (day 5)
    const fridayOnlySchedule: CurfewSchedule = {
      startHour: 22,
      startMinute: 0,
      endHour: 10,
      endMinute: 0,
      activeDays: [5], // Friday only (1=Mon..7=Sun)
      enabled: true,
    };

    it('is active on Friday night after 22:00', () => {
      // Friday Oct 16 2026, 22:30
      const fridayNight = new Date(2026, 9, 16, 22, 30);
      expect(isCurfewActive(fridayOnlySchedule, fridayNight)).toBe(true);
    });

    it('is active on Saturday morning before 10:00 (continuation of Friday night)', () => {
      // Saturday Oct 17 2026, 04:00
      const saturdayMorning = new Date(2026, 9, 17, 4, 0);
      expect(isCurfewActive(fridayOnlySchedule, saturdayMorning)).toBe(true);
    });

    it('is inactive on Saturday night after 22:00 (Saturday not in activeDays)', () => {
      // Saturday Oct 17 2026, 22:30
      const saturdayNight = new Date(2026, 9, 17, 22, 30);
      expect(isCurfewActive(fridayOnlySchedule, saturdayNight)).toBe(false);
    });

    it('is inactive on Sunday morning before 10:00', () => {
      // Sunday Oct 18 2026, 05:00
      const sundayMorning = new Date(2026, 9, 18, 5, 0);
      expect(isCurfewActive(fridayOnlySchedule, sundayMorning)).toBe(false);
    });
  });

  describe('Same-Day Curfew (e.g. 13:00 to 17:00)', () => {
    const afternoonSchedule: CurfewSchedule = {
      startHour: 13,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
      activeDays: [1, 2, 3, 4, 5], // Weekdays
      enabled: true,
    };

    it('is active during the window on an active weekday', () => {
      // Monday 15:00
      const mondayAfternoon = new Date(2026, 9, 12, 15, 0);
      expect(isCurfewActive(afternoonSchedule, mondayAfternoon)).toBe(true);
    });

    it('is inactive outside the window on a weekday', () => {
      // Monday 11:00
      const mondayMorning = new Date(2026, 9, 12, 11, 0);
      expect(isCurfewActive(afternoonSchedule, mondayMorning)).toBe(false);
    });
  });

  describe('Transition Calculation', () => {
    it('returns remaining minutes until window ends when active', () => {
      // 23:30 with end time 10:00 -> 30m + 10h = 630m remaining
      const testDate = new Date(2026, 9, 14, 23, 30);
      const transition = getNextTransition(defaultOvernightSchedule, testDate);
      expect(transition.isActive).toBe(true);
      expect(transition.minutesRemaining).toBe(630);
      expect(transition.targetTimeFormatted).toBe('10:00 AM');
    });

    it('returns remaining minutes until window starts when inactive', () => {
      // 20:00 with start time 22:00 -> 120m remaining
      const testDate = new Date(2026, 9, 14, 20, 0);
      const transition = getNextTransition(defaultOvernightSchedule, testDate);
      expect(transition.isActive).toBe(false);
      expect(transition.minutesRemaining).toBe(120);
      expect(transition.targetTimeFormatted).toBe('10:00 PM');
    });
  });

  describe('Driver Interaction', () => {
    it('calls native schedule driver getSchedule and setSchedule', async () => {
      (NativeModules.CurfewScheduleModule.getSchedule as jest.Mock).mockResolvedValueOnce(defaultOvernightSchedule);
      (NativeModules.CurfewScheduleModule.setSchedule as jest.Mock).mockResolvedValueOnce(true);

      const schedule = await defaultScheduleDriver.getSchedule();
      expect(schedule).toEqual(defaultOvernightSchedule);

      const saved = await defaultScheduleDriver.setSchedule(defaultOvernightSchedule);
      expect(saved).toBe(true);
    });
  });
});
