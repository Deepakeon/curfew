export const HARD_LOCKOUT_BANNER_TEXT =
  'Curfew is in progress. Schedule and Target App modifications are locked.';

export interface HardLockoutState {
  isLocked: boolean;
  bannerVisible: boolean;
  message: string;
}

export function canModifySettings(isCurfewActive: boolean): boolean {
  return !isCurfewActive;
}

export function evaluateHardLockout(
  isCurfewActive: boolean,
  attemptedChange: boolean = false
): HardLockoutState {
  const isLocked = isCurfewActive;
  const bannerVisible = isCurfewActive || attemptedChange;

  return {
    isLocked,
    bannerVisible,
    message: HARD_LOCKOUT_BANNER_TEXT,
  };
}
