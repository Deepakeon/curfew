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

  it('exposes radii and spacing tokens', () => {
    expect(theme.rounded.sm).toBe(6);
    expect(theme.rounded.md).toBe(8);
    expect(theme.rounded.lg).toBe(12);
    expect(theme.rounded.full).toBe(9999);
    expect(theme.spacing.md).toBe(16);
  });
});
