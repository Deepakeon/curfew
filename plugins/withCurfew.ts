import {
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_PERMISSIONS = [
  'android.permission.QUERY_ALL_PACKAGES',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
];

export function modifyAndroidManifest(
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const { manifest } = androidManifest;

  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }

  const existingPermissions = new Set(
    manifest['uses-permission'].map((p: any) => p.$['android:name'])
  );

  for (const perm of REQUIRED_PERMISSIONS) {
    if (!existingPermissions.has(perm)) {
      manifest['uses-permission'].push({
        $: { 'android:name': perm },
      } as any);
    }
  }

  const app = manifest.application?.[0];
  if (app) {
    if (!app.service) {
      app.service = [];
    }
    const hasAccessibilityService = app.service.some(
      (s: any) => s.$['android:name'] === '.CurfewAccessibilityService'
    );
    if (!hasAccessibilityService) {
      app.service.push({
        $: {
          'android:name': '.CurfewAccessibilityService',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      } as any);
    }

    if (!app.receiver) {
      app.receiver = [];
    }
    const hasBootReceiver = app.receiver.some(
      (r: any) => r.$['android:name'] === '.BootReceiver'
    );
    if (!hasBootReceiver) {
      app.receiver.push({
        $: {
          'android:name': '.BootReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.BOOT_COMPLETED',
                },
              },
            ],
          },
        ],
      } as any);
    }
  }

  return androidManifest;
}

export function syncNativeFiles(platformRoot: string, projectRoot: string) {
  const resXmlTarget = path.join(platformRoot, 'app/src/main/res/xml');
  if (!fs.existsSync(resXmlTarget)) {
    fs.mkdirSync(resXmlTarget, { recursive: true });
  }

  const xmlSource = path.join(
    projectRoot,
    'plugins/native/res/xml/accessibility_service_config.xml'
  );
  if (fs.existsSync(xmlSource)) {
    fs.copyFileSync(
      xmlSource,
      path.join(resXmlTarget, 'accessibility_service_config.xml')
    );
  }

  const javaTarget = path.join(
    platformRoot,
    'app/src/main/java/com/curfew'
  );
  if (!fs.existsSync(javaTarget)) {
    fs.mkdirSync(javaTarget, { recursive: true });
  }

  const kotlinSourceDir = path.join(projectRoot, 'plugins/native/kotlin');
  if (fs.existsSync(kotlinSourceDir)) {
    const files = fs.readdirSync(kotlinSourceDir);
    for (const file of files) {
      fs.copyFileSync(
        path.join(kotlinSourceDir, file),
        path.join(javaTarget, file)
      );
    }
  }
}

const withCurfew: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, (configWithManifest) => {
    configWithManifest.modResults = modifyAndroidManifest(
      configWithManifest.modResults
    );
    return configWithManifest;
  });

  config = withDangerousMod(config, [
    'android',
    async (dangerousConfig) => {
      syncNativeFiles(
        dangerousConfig.modRequest.platformProjectRoot,
        dangerousConfig.modRequest.projectRoot
      );
      return dangerousConfig;
    },
  ]);

  return config;
};

export default withCurfew;
