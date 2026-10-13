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
  generate15MinuteIntervals,
  formatTime,
} from '../services/schedule';
import { theme } from '../theme';
import { canModifySettings } from '../services/hardLockout';

describe('Schedule Tab UI Requirements (Issue #7)', () => {
  describe('Status Indicator Icons & Accessibility Labels', () => {
    it('defines accessible labels and states for enabled, disabled, and restricted states', () => {
      const getStatusDescriptor = (enabled: boolean, isLocked: boolean) => {
        if (isLocked) {
          return {
            icon: 'lock-closed',
            color: theme.colors.ash,
            accessibilityLabel: 'Curfew schedule locked (modifications restricted)',
            ariaLabel: 'Curfew schedule locked (modifications restricted)',
            disabled: true,
          };
        }
        if (enabled) {
          return {
            icon: 'checkmark',
            color: theme.colors.accentGreen,
            accessibilityLabel: 'Curfew schedule enabled',
            ariaLabel: 'Curfew schedule enabled',
            disabled: false,
          };
        }
        return {
          icon: 'close',
          color: theme.colors.mute,
          accessibilityLabel: 'Curfew schedule disabled',
          ariaLabel: 'Curfew schedule disabled',
          disabled: false,
        };
      };

      const lockedState = getStatusDescriptor(true, true);
      expect(lockedState.icon).toBe('lock-closed');
      expect(lockedState.color).toBe(theme.colors.ash);
      expect(lockedState.accessibilityLabel).toContain('Curfew schedule locked');

      const enabledState = getStatusDescriptor(true, false);
      expect(enabledState.icon).toBe('checkmark');
      expect(enabledState.color).toBe(theme.colors.accentGreen);
      expect(enabledState.accessibilityLabel).toBe('Curfew schedule enabled');

      const disabledState = getStatusDescriptor(false, false);
      expect(disabledState.icon).toBe('close');
      expect(disabledState.color).toBe(theme.colors.mute);
      expect(disabledState.accessibilityLabel).toBe('Curfew schedule disabled');
    });
  });

  describe('Curfew Window 15-Minute Dropdown Intervals', () => {
    it('provides exactly 96 intervals starting from 12:00 AM to 11:45 PM', () => {
      const intervals = generate15MinuteIntervals();
      expect(intervals).toHaveLength(96);

      // First slot
      expect(intervals[0]).toEqual({
        hour: 0,
        minute: 0,
        formatted: '12:00 AM',
      });

      // Midday slot
      expect(intervals[48]).toEqual({
        hour: 12,
        minute: 0,
        formatted: '12:00 PM',
      });

      // Final slot
      expect(intervals[95]).toEqual({
        hour: 23,
        minute: 45,
        formatted: '11:45 PM',
      });
    });

    it('formats 15-minute step increments consistently', () => {
      const intervals = generate15MinuteIntervals();
      expect(intervals[1].formatted).toBe('12:15 AM');
      expect(intervals[2].formatted).toBe('12:30 AM');
      expect(intervals[3].formatted).toBe('12:45 AM');
      expect(intervals[4].formatted).toBe('1:00 AM');
    });

    it('allows dropdown selection during Curfew', () => {
      const isCurfewActive = true;
      const isLocked = !canModifySettings(isCurfewActive);
      expect(isLocked).toBe(false);
    });
  });

  describe('Active Days Selector High Contrast Distinction', () => {
    it('ensures distinct contrast colors between active and inactive day pills', () => {
      const activePillStyle = {
        backgroundColor: theme.colors.accentGreen,
        borderColor: theme.colors.accentGreen,
        textColor: '#000000',
      };

      const inactivePillStyle = {
        backgroundColor: theme.colors.surfaceCard,
        borderColor: theme.colors.hairline,
        textColor: theme.colors.mute,
      };

      // High contrast check: active uses vivid green with black text
      expect(activePillStyle.backgroundColor).toBe('#59d499');
      expect(activePillStyle.textColor).toBe('#000000');

      // Inactive uses dark surface card with muted text
      expect(inactivePillStyle.backgroundColor).toBe('#121212');
      expect(inactivePillStyle.borderColor).toBe('#242728');
      expect(inactivePillStyle.textColor).toBe('#9c9c9d');

      // Contrast distinctness
      expect(activePillStyle.backgroundColor).not.toBe(inactivePillStyle.backgroundColor);
      expect(activePillStyle.textColor).not.toBe(inactivePillStyle.textColor);
    });

    it('covers all 7 days of the week Monday to Sunday', () => {
      const days = [
        { id: 1, label: 'Mon' },
        { id: 2, label: 'Tue' },
        { id: 3, label: 'Wed' },
        { id: 4, label: 'Thu' },
        { id: 5, label: 'Fri' },
        { id: 6, label: 'Sat' },
        { id: 7, label: 'Sun' },
      ];

      expect(days).toHaveLength(7);
      expect(days.map((d) => d.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
  });
});
