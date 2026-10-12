import { modifyAndroidManifest, syncNativeFiles } from '../withCurfew';
import { AndroidConfig } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

describe('withCurfew Expo Config Plugin', () => {
  it('injects required Android permissions into AndroidManifest', () => {
    const mockManifest = {
      manifest: {
        $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android', package: 'com.curfew' },
        application: [{ $: { 'android:name': '.MainApplication' } }],
      },
    } as unknown as AndroidConfig.Manifest.AndroidManifest;

    const updated = modifyAndroidManifest(mockManifest);
    const permissions = (updated.manifest['uses-permission'] || []).map(
      (p: any) => p.$['android:name']
    );

    expect(permissions).toContain('android.permission.QUERY_ALL_PACKAGES');
    expect(permissions).toContain('android.permission.SYSTEM_ALERT_WINDOW');
    expect(permissions).toContain('android.permission.RECEIVE_BOOT_COMPLETED');
    expect(permissions).toContain('android.permission.FOREGROUND_SERVICE');
    expect(permissions).toContain('android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
  });

  it('declares CurfewAccessibilityService and BootReceiver in application', () => {
    const mockManifest = {
      manifest: {
        $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android', package: 'com.curfew' },
        application: [{ $: { 'android:name': '.MainApplication' } }],
      },
    } as unknown as AndroidConfig.Manifest.AndroidManifest;

    const updated = modifyAndroidManifest(mockManifest);
    const app = updated.manifest.application![0];

    const serviceNames = (app.service || []).map((s: any) => s.$['android:name']);
    expect(serviceNames).toContain('.CurfewAccessibilityService');

    const receiverNames = (app.receiver || []).map((r: any) => r.$['android:name']);
    expect(receiverNames).toContain('.BootReceiver');
  });

  it('syncNativeFiles copies XML and Kotlin native files to android directory', () => {
    const tempPlatform = path.join(__dirname, '__temp_platform__');
    const projectRoot = path.join(__dirname, '..', '..');

    syncNativeFiles(tempPlatform, projectRoot);

    const xmlExists = fs.existsSync(
      path.join(tempPlatform, 'app/src/main/res/xml/accessibility_service_config.xml')
    );
    const kotlinExists = fs.existsSync(
      path.join(tempPlatform, 'app/src/main/java/com/curfew/CurfewAccessibilityService.kt')
    );

    expect(xmlExists).toBe(true);
    expect(kotlinExists).toBe(true);

    // Clean up
    fs.rmSync(tempPlatform, { recursive: true, force: true });
  });
});
