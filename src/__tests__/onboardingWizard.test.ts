import { PermissionsState } from '../services/permissions';

export function computeWizardProgress(permissions: PermissionsState) {
  const grantedCount = [
    Boolean(permissions.accessibility),
    Boolean(permissions.overlay),
    Boolean(permissions.batteryIgnored),
  ].filter(Boolean).length;
  const totalCount = 3;
  const isFullyArmed = Boolean(permissions.allGranted) || grantedCount === totalCount;
  const progressPercent = Math.round((grantedCount / totalCount) * 100);

  return {
    grantedCount,
    totalCount,
    isFullyArmed,
    progressPercent,
  };
}

describe('OnboardingWizard Progress & Armed State Logic', () => {
  it('correctly tracks progress when no permissions are granted', () => {
    const state: PermissionsState = {
      accessibility: false,
      overlay: false,
      batteryIgnored: false,
      allGranted: false,
    };
    const progress = computeWizardProgress(state);
    expect(progress.grantedCount).toBe(0);
    expect(progress.totalCount).toBe(3);
    expect(progress.progressPercent).toBe(0);
    expect(progress.isFullyArmed).toBe(false);
  });

  it('correctly tracks partial progress when some permissions are granted', () => {
    const state: PermissionsState = {
      accessibility: true,
      overlay: false,
      batteryIgnored: true,
      allGranted: false,
    };
    const progress = computeWizardProgress(state);
    expect(progress.grantedCount).toBe(2);
    expect(progress.totalCount).toBe(3);
    expect(progress.progressPercent).toBe(67);
    expect(progress.isFullyArmed).toBe(false);
  });

  it('correctly flags engine armed state when all 3 permissions are granted', () => {
    const state: PermissionsState = {
      accessibility: true,
      overlay: true,
      batteryIgnored: true,
      allGranted: true,
    };
    const progress = computeWizardProgress(state);
    expect(progress.grantedCount).toBe(3);
    expect(progress.totalCount).toBe(3);
    expect(progress.progressPercent).toBe(100);
    expect(progress.isFullyArmed).toBe(true);
  });
});
