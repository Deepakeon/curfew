const mockPlatform = { OS: 'android' };
const mockStatusBar = { currentHeight: 24 as number | undefined };

jest.mock('react-native', () => ({
  get Platform() {
    return mockPlatform;
  },
  get StatusBar() {
    return mockStatusBar;
  },
}));

import { getAndroidStatusBarHeight } from '../utils/layout';

describe('App Layout & Status Bar Insets', () => {
  afterEach(() => {
    mockPlatform.OS = 'android';
    mockStatusBar.currentHeight = 24;
  });

  it('returns StatusBar.currentHeight when platform is android', () => {
    mockPlatform.OS = 'android';
    mockStatusBar.currentHeight = 28;

    expect(getAndroidStatusBarHeight()).toBe(28);
  });

  it('returns 0 when platform is ios (SafeAreaView handles insets natively)', () => {
    mockPlatform.OS = 'ios';
    mockStatusBar.currentHeight = 28;

    expect(getAndroidStatusBarHeight()).toBe(0);
  });

  it('defaults to 0 if StatusBar.currentHeight is undefined on android', () => {
    mockPlatform.OS = 'android';
    mockStatusBar.currentHeight = undefined;

    expect(getAndroidStatusBarHeight()).toBe(0);
  });
});
