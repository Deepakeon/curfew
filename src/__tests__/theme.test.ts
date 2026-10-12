import { theme } from '../theme';

describe('Raycast Theme Tokens (DESIGN.md)', () => {
  it('exposes the void-black canvas and surface ladder', () => {
    expect(theme.colors.canvas).toBe('#07080a');
    expect(theme.colors.surface).toBe('#0d0d0d');
    expect(theme.colors.surfaceElevated).toBe('#101111');
    expect(theme.colors.surfaceCard).toBe('#121212');
  });

  it('exposes high-contrast ink and muted text tokens', () => {
    expect(theme.colors.ink).toBe('#f4f4f6');
    expect(theme.colors.body).toBe('#cdcdcd');
    expect(theme.colors.mute).toBe('#9c9c9d');
  });

  it('exposes hairline borders and status accents', () => {
    expect(theme.colors.hairline).toBe('#242728');
    expect(theme.colors.accentRed).toBe('#ff6161');
    expect(theme.colors.accentGreen).toBe('#59d499');
    expect(theme.colors.accentYellow).toBe('#ffc533');
    expect(theme.colors.accentBlue).toBe('#57c1ff');
  });

  it('exposes exact DESIGN.md radii and spacing ladders', () => {
    expect(theme.rounded.none).toBe(0);
    expect(theme.rounded.sm).toBe(6);
    expect(theme.rounded.md).toBe(8);
    expect(theme.rounded.lg).toBe(10);
    expect(theme.rounded.full).toBe(9999);

    expect(theme.spacing.xxs).toBe(2);
    expect(theme.spacing.xs).toBe(4);
    expect(theme.spacing.sm).toBe(8);
    expect(theme.spacing.md).toBe(12);
    expect(theme.spacing.lg).toBe(16);
    expect(theme.spacing.xl).toBe(24);
    expect(theme.spacing.xxl).toBe(32);
  });

  it('exposes standard DESIGN.md typography scale', () => {
    expect(theme.typography.headingMd.fontSize).toBe(20);
    expect(theme.typography.headingMd.fontWeight).toBe('500');
    expect(theme.typography.bodyMd.fontSize).toBe(16);
    expect(theme.typography.bodyMd.fontWeight).toBe('400');
  });
});
