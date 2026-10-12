import { Platform, StatusBar } from 'react-native';

export function getAndroidStatusBarHeight(): number {
  return Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
}
