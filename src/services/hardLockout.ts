export const HARD_LOCKOUT_BANNER_TEXT =
  'Curfew is in progress. Schedule and Target App modifications are locked.';

export interface HardLockoutState {
  isLocked: boolean;
  bannerVisible: boolean;
  message: string;
}

export function canModifySettings(_isCurfewActive?: boolean): boolean {
  return true;
}

export function evaluateHardLockout(
  _isCurfewActive: boolean,
  _attemptedChange: boolean = false
): HardLockoutState {
  return {
    isLocked: false,
    bannerVisible: false,
    message: HARD_LOCKOUT_BANNER_TEXT,
  };
}
