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
  isOvernightWindow,
  formatTime,
  generate15MinuteIntervals,
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

  it('detects overnight windows correctly', () => {
    expect(isOvernightWindow(defaultOvernightSchedule)).toBe(true);
    expect(
      isOvernightWindow({
        ...defaultOvernightSchedule,
        startHour: 9,
        endHour: 17,
      })
    ).toBe(false);
  });

  describe('15-Minute Interval Generation', () => {
    it('generates exactly 96 intervals covering 24 hours', () => {
      const intervals = generate15MinuteIntervals();
      expect(intervals).toHaveLength(96);
      expect(intervals[0]).toEqual({
        hour: 0,
        minute: 0,
        formatted: '12:00 AM',
      });
      expect(intervals[95]).toEqual({
        hour: 23,
        minute: 45,
        formatted: '11:45 PM',
      });
    });

    it('generates valid 15-minute steps', () => {
      const intervals = generate15MinuteIntervals();
      expect(intervals[1]).toEqual({
        hour: 0,
        minute: 15,
        formatted: '12:15 AM',
      });
      expect(intervals[48]).toEqual({
        hour: 12,
        minute: 0,
        formatted: '12:00 PM',
      });
    });
  });

  describe('Overnight Curfew (22:00 to 10:00)', () => {
    it('is active late at night (e.g., 23:30)', () => {
      // Wednesday 23:30
      const testDate = new Date(2026, 9, 14, 23, 30);
      expect(isCurfewActive(defaultOvernightSchedule, testDate)).toBe(true);
    });

    it('is active early in the morning before 10:00 AM (e.g., 07:15)', () => {
      // Thursday 07:15
      const testDate = new Date(2026, 9, 15, 7, 15);
      expect(isCurfewActive(defaultOvernightSchedule, testDate)).toBe(true);
    });

    it('is inactive during the day (e.g., 14:00)', () => {
      // Thursday 14:00
      const testDate = new Date(2026, 9, 15, 14, 0);
      expect(isCurfewActive(defaultOvernightSchedule, testDate)).toBe(false);
    });

    it('is inactive when schedule is disabled', () => {
      const disabledSchedule = { ...defaultOvernightSchedule, enabled: false };
      const testDate = new Date(2026, 9, 14, 23, 30);
      expect(isCurfewActive(disabledSchedule, testDate)).toBe(false);
    });

    it('is inactive when start time equals end time (0 duration)', () => {
      const zeroDurationSchedule: CurfewSchedule = {
        ...defaultOvernightSchedule,
        startHour: 10,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
      };
      const testDate = new Date(2026, 9, 14, 10, 0);
      expect(isCurfewActive(zeroDurationSchedule, testDate)).toBe(false);
    });
  });

  describe('Day-of-Week Recurrence Filtering', () => {
    const fridayOnlySchedule: CurfewSchedule = {
      startHour: 22,
      startMinute: 0,
      endHour: 10,
      endMinute: 0,
      activeDays: [5], // Friday only (1=Mon..7=Sun)
      enabled: true,
    };

    it('is active on Friday night after 22:00', () => {
      const fridayNight = new Date(2026, 9, 16, 22, 30);
      expect(isCurfewActive(fridayOnlySchedule, fridayNight)).toBe(true);
    });

    it('is active on Saturday morning before 10:00 (continuation of Friday night)', () => {
      const saturdayMorning = new Date(2026, 9, 17, 4, 0);
      expect(isCurfewActive(fridayOnlySchedule, saturdayMorning)).toBe(true);
    });

    it('is inactive on Saturday night after 22:00 (Saturday not in activeDays)', () => {
      const saturdayNight = new Date(2026, 9, 17, 22, 30);
      expect(isCurfewActive(fridayOnlySchedule, saturdayNight)).toBe(false);
    });

    it('is inactive on Sunday morning before 10:00', () => {
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
      activeDays: [1, 2, 3, 4, 5],
      enabled: true,
    };

    it('is active during the window on an active weekday', () => {
      const mondayAfternoon = new Date(2026, 9, 12, 15, 0);
      expect(isCurfewActive(afternoonSchedule, mondayAfternoon)).toBe(true);
    });

    it('is inactive outside the window on a weekday', () => {
      const mondayMorning = new Date(2026, 9, 12, 11, 0);
      expect(isCurfewActive(afternoonSchedule, mondayMorning)).toBe(false);
    });
  });

  describe('Transition Calculation', () => {
    it('returns remaining minutes until window ends when active', () => {
      const testDate = new Date(2026, 9, 14, 23, 30);
      const transition = getNextTransition(defaultOvernightSchedule, testDate);
      expect(transition.isActive).toBe(true);
      expect(transition.minutesRemaining).toBe(630);
      expect(transition.targetTimeFormatted).toBe('10:00 AM');
    });

    it('returns remaining minutes until window starts when inactive', () => {
      const testDate = new Date(2026, 9, 14, 20, 0);
      const transition = getNextTransition(defaultOvernightSchedule, testDate);
      expect(transition.isActive).toBe(false);
      expect(transition.minutesRemaining).toBe(120);
      expect(transition.targetTimeFormatted).toBe('10:00 PM');
    });

    it('skips inactive days when calculating next transition', () => {
      // Wednesday 20:00 with schedule active only on Friday (offset = 2 days)
      const fridayOnlySchedule: CurfewSchedule = {
        ...defaultOvernightSchedule,
        activeDays: [5], // Friday
      };
      const wednesdayEve = new Date(2026, 9, 14, 20, 0); // Wed Oct 14 2026
      const transition = getNextTransition(fridayOnlySchedule, wednesdayEve);

      expect(transition.isActive).toBe(false);
      // Remaining = Wed 4h (240m) + Thu 24h (1440m) + Fri 22h (1320m) = 3000m
      expect(transition.minutesRemaining).toBe(3000);
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
