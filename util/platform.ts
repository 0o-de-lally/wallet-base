import { Platform } from 'react-native';

export enum RuntimePlatform {
  Mobile = 'mobile',
  Web = 'web',
  Desktop = 'desktop'
}

export function getPlatform(): RuntimePlatform {
  if (Platform.OS === 'web') {
    return RuntimePlatform.Web;
  }

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return RuntimePlatform.Mobile;
  }

  // Check for desktop platforms (electron, tauri, etc)
  if (typeof window !== 'undefined' && !('navigator' in window)) {
    return RuntimePlatform.Desktop;
  }

  // Fallback to web if nothing else matches
  return RuntimePlatform.Web;
}

export function isMobile(): boolean {
  return getPlatform() === RuntimePlatform.Mobile;
}

export function isWeb(): boolean {
  return getPlatform() === RuntimePlatform.Web;
}

export function isDesktop(): boolean {
  return getPlatform() === RuntimePlatform.Desktop;
}
