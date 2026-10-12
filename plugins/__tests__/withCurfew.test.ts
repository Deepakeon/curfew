import { modifyAndroidManifest, syncNativeFiles, modifyMainApplication } from '../withCurfew';
import { AndroidConfig } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

function createMockManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android', package: 'com.curfew' },
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  } as unknown as AndroidConfig.Manifest.AndroidManifest;
}

describe('withCurfew Expo Config Plugin', () => {
  it('injects required Android permissions into AndroidManifest', () => {
    const mockManifest = createMockManifest();
    const updated = modifyAndroidManifest(mockManifest);
    const permissions = (updated.manifest['uses-permission'] || []).map(
      (permNode: any) => permNode.$['android:name']
    );

    expect(permissions).toContain('android.permission.QUERY_ALL_PACKAGES');
    expect(permissions).toContain('android.permission.SYSTEM_ALERT_WINDOW');
    expect(permissions).toContain('android.permission.RECEIVE_BOOT_COMPLETED');
    expect(permissions).toContain('android.permission.FOREGROUND_SERVICE');
    expect(permissions).toContain('android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
  });

  it('declares CurfewAccessibilityService and BootReceiver in application', () => {
    const mockManifest = createMockManifest();
    const updated = modifyAndroidManifest(mockManifest);
    const app = updated.manifest.application![0];

    const serviceNames = (app.service || []).map(
      (serviceNode: any) => serviceNode.$['android:name']
    );
    expect(serviceNames).toContain('.CurfewAccessibilityService');

    const receiverNames = (app.receiver || []).map(
      (receiverNode: any) => receiverNode.$['android:name']
    );
    expect(receiverNames).toContain('.BootReceiver');
  });

  it('syncNativeFiles copies XML and Kotlin native files to dynamic package directory', () => {
    const tempPlatform = path.join(__dirname, '__temp_platform__');
    const projectRoot = path.join(__dirname, '..', '..');
    const customPackage = 'com.custom.curfew';

    syncNativeFiles(tempPlatform, projectRoot, customPackage);

    const xmlExists = fs.existsSync(
      path.join(tempPlatform, 'app/src/main/res/xml/accessibility_service_config.xml')
    );
    const kotlinExists = fs.existsSync(
      path.join(tempPlatform, 'app/src/main/java/com/custom/curfew/CurfewAccessibilityService.kt')
    );
    const packageExists = fs.existsSync(
      path.join(tempPlatform, 'app/src/main/java/com/custom/curfew/CurfewPackage.kt')
    );

    expect(xmlExists).toBe(true);
    expect(kotlinExists).toBe(true);
    expect(packageExists).toBe(true);

    // Clean up
    fs.rmSync(tempPlatform, { recursive: true, force: true });
  });

  it('modifies MainApplication to register CurfewPackage', () => {
    const mockContent = `
      PackageList(this).packages.apply {
        // Packages that cannot be autolinked yet can be added manually here, for example:
        // add(MyReactNativePackage())
      }
    `;
    const updated = modifyMainApplication(mockContent);
    expect(updated).toContain('add(CurfewPackage())');
  });
});
