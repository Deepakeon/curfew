import {
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
  withAppBuildGradle,
  AndroidConfig,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_PERMISSIONS = [
  'android.permission.QUERY_ALL_PACKAGES',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  'android.permission.PACKAGE_USAGE_STATS',
];

export function modifyAndroidManifest(
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const { manifest } = androidManifest;

  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }

  const existingPermissions = new Set(
    manifest['uses-permission'].map(
      (permNode: any) => permNode.$['android:name']
    )
  );

  for (const permission of REQUIRED_PERMISSIONS) {
    if (!existingPermissions.has(permission)) {
      manifest['uses-permission'].push({
        $: { 'android:name': permission },
      } as any);
    }
  }

  const app = manifest.application?.[0];
  if (app) {
    if (!app.service) {
      app.service = [];
    }
    // Remove legacy AccessibilityService if present to ensure banking apps are not blocked
    app.service = app.service.filter(
      (serviceNode: any) =>
        serviceNode.$?.['android:name'] !== '.CurfewAccessibilityService'
    );

    const hasForegroundService = app.service.some(
      (serviceNode: any) =>
        serviceNode.$['android:name'] === '.CurfewForegroundService'
    );
    if (!hasForegroundService) {
      app.service.push({
        $: {
          'android:name': '.CurfewForegroundService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'Maintain curfew keep-alive and background evaluation',
            },
          },
        ],
      } as any);
    }

    if (!app.receiver) {
      app.receiver = [];
    }
    const hasBootReceiver = app.receiver.some(
      (receiverNode: any) =>
        receiverNode.$['android:name'] === '.BootReceiver'
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

export function modifyMainApplication(content: string): string {
  if (content.includes('CurfewPackage()')) {
    return content;
  }

  const placeholder = '// add(MyReactNativePackage())';
  if (content.includes(placeholder)) {
    return content.replace(
      placeholder,
      `${placeholder}\n          add(CurfewPackage())`
    );
  }

  // Fallback: search for packageList block
  const packageListApply = 'PackageList(this).packages.apply {';
  if (content.includes(packageListApply)) {
    return content.replace(
      packageListApply,
      `${packageListApply}\n          add(CurfewPackage())`
    );
  }

  return content;
}

export function syncNativeFiles(
  platformRoot: string,
  projectRoot: string,
  packageName: string = 'com.curfew'
) {
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

  const packageSubpath = packageName.replace(/\./g, '/');
  const javaTarget = path.join(
    platformRoot,
    'app/src/main/java',
    packageSubpath
  );
  if (!fs.existsSync(javaTarget)) {
    fs.mkdirSync(javaTarget, { recursive: true });
  }

  const kotlinSourceDir = path.join(projectRoot, 'plugins/native/kotlin');
  if (fs.existsSync(kotlinSourceDir)) {
    const nativeFiles = fs.readdirSync(kotlinSourceDir);
    for (const file of nativeFiles) {
      fs.copyFileSync(
        path.join(kotlinSourceDir, file),
        path.join(javaTarget, file)
      );
    }
  }

  // Wire CurfewPackage into MainApplication.kt
  const mainAppPath = path.join(javaTarget, 'MainApplication.kt');
  if (fs.existsSync(mainAppPath)) {
    const mainAppContent = fs.readFileSync(mainAppPath, 'utf8');
    const updatedContent = modifyMainApplication(mainAppContent);
    if (updatedContent !== mainAppContent) {
      fs.writeFileSync(mainAppPath, updatedContent, 'utf8');
    }
  }
}

export function modifyAppBuildGradle(content: string): string {
  if (content.includes('// --- Curfew Release Signing Configuration ---')) {
    return content;
  }

  const helperBlock = `
// --- Curfew Release Signing Configuration ---
def keystorePropertiesFile = [
    new File(rootDir.parentFile, "keystore.properties"),
    new File(rootDir, "keystore.properties"),
    file("keystore.properties")
].find { it != null && it.exists() }

def keystoreProperties = new Properties()
if (keystorePropertiesFile != null && keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

def resolveKeystoreFile = { String path, File propFileDir ->
    if (!path) return null
    if (path.startsWith("~/")) {
        return new File(System.getProperty("user.home"), path.substring(2))
    }
    def f = new File(path)
    if (f.isAbsolute()) {
        return f
    }
    if (propFileDir != null) {
        def propRelative = new File(propFileDir, path)
        if (propRelative.exists()) return propRelative
    }
    def rootRelative = new File(rootDir.parentFile, path)
    if (rootRelative.exists()) return rootRelative
    return propFileDir != null ? new File(propFileDir, path) : new File(rootDir.parentFile, path)
}

def releaseStoreFilePath = keystoreProperties['storeFile'] ?: System.getenv('ANDROID_KEYSTORE_PATH') ?: System.getenv('RELEASE_STORE_FILE')
def releaseStorePassword = keystoreProperties['storePassword'] ?: System.getenv('ANDROID_KEYSTORE_PASSWORD') ?: System.getenv('RELEASE_STORE_PASSWORD')
def releaseKeyAlias = keystoreProperties['keyAlias'] ?: System.getenv('ANDROID_KEY_ALIAS') ?: System.getenv('RELEASE_KEY_ALIAS')
def releaseKeyPassword = keystoreProperties['keyPassword'] ?: System.getenv('ANDROID_KEY_PASSWORD') ?: System.getenv('RELEASE_KEY_PASSWORD')
`;

  const signingReleaseBlock = `
        release {
            if (releaseStoreFilePath && releaseStorePassword && releaseKeyAlias && releaseKeyPassword) {
                def propDir = keystorePropertiesFile != null ? keystorePropertiesFile.parentFile : null
                storeFile resolveKeystoreFile(releaseStoreFilePath, propDir)
                storePassword releaseStorePassword
                keyAlias releaseKeyAlias
                keyPassword releaseKeyPassword
            }
        }`;

  const taskGuardBlock = `
gradle.taskGraph.whenReady { taskGraph ->
    def isReleaseBuild = taskGraph.allTasks.any { task ->
        task.name.contains("Release") && (task.name.startsWith("assemble") || task.name.startsWith("bundle") || task.name.startsWith("package"))
    }
    if (isReleaseBuild) {
        if (!android.signingConfigs.release.storeFile) {
            throw new GradleException(
                "Release signing credentials not configured. Please create keystore.properties (see keystore.properties.example) or set environment variables (RELEASE_STORE_FILE, RELEASE_STORE_PASSWORD, RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD)."
            )
        } else if (!android.signingConfigs.release.storeFile.exists()) {
            throw new GradleException(
                "Release keystore file not found at: \${android.signingConfigs.release.storeFile.absolutePath}. Please check 'storeFile' in keystore.properties."
            )
        }
    }
}
`;

  const splitsBlock = `
    splits {
        abi {
            reset()
            def enableSplits = (findProperty('enableSplits') ?: 'true').toBoolean()
            enable enableSplits
            universalApk (findProperty('universalApk') ? findProperty('universalApk').toBoolean() : true)
            def targetAbis = (findProperty('targetAbis') ?: findProperty('reactNativeArchitectures') ?: "armeabi-v7a,arm64-v8a,x86,x86_64").split(',').collect { it.trim() }.findAll { !it.isEmpty() }
            if (!targetAbis.isEmpty()) {
                include(*targetAbis)
            }
        }
    }
`;

  const applicationVariantsBlock = `
    applicationVariants.all { variant ->
        def baseVersionCode = variant.versionCode
        def rawVersionName = variant.versionName ?: "1.0.0"
        def cleanVersionName = rawVersionName.replaceFirst(/^[vV]/, '')
        def abiVersionCodes = [
            'universal': 0,
            'armeabi-v7a': 1,
            'x86': 2,
            'arm64-v8a': 3,
            'x86_64': 4
        ]

        variant.outputs.each { output ->
            def filter = output.getFilter(com.android.build.OutputFile.ABI)
            def abi = filter != null ? filter : 'universal'
            def offset = abiVersionCodes.get(abi) ?: 0
            def calculatedVersionCode = baseVersionCode * 10 + offset

            def setViaProperty = false
            if (output.hasProperty("versionCode") && output.versionCode != null) {
                try {
                    output.versionCode.set(calculatedVersionCode)
                    setViaProperty = true
                } catch (Exception ignored) {}
            }
            if (!setViaProperty) {
                output.versionCodeOverride = calculatedVersionCode
            }

            if (variant.buildType.name == 'release') {
                output.outputFileName = "curfew_V\${cleanVersionName}_\${abi}.apk"
            }
        }
    }
`;

  let result = content;

  // Dynamic versioning in defaultConfig
  result = result.replace(
    /versionCode\s+(\d+)/,
    "versionCode (findProperty('versionCode') ? findProperty('versionCode').toInteger() : $1)"
  );
  result = result.replace(
    /versionName\s+(["'][^"']+["'])/,
    "versionName (findProperty('versionName') ?: $1)"
  );

  // Insert helper block before android {
  const androidIdx = result.indexOf('android {');
  if (androidIdx !== -1) {
    result = result.slice(0, androidIdx) + helperBlock + '\n' + result.slice(androidIdx);
  }

  // Insert splitsBlock before signingConfigs { (or before buildTypes {)
  const signingConfigsIdx = result.indexOf('signingConfigs {');
  if (signingConfigsIdx !== -1) {
    result = result.slice(0, signingConfigsIdx) + splitsBlock + '\n    ' + result.slice(signingConfigsIdx);
  } else {
    const buildTypesIdx = result.indexOf('buildTypes {');
    if (buildTypesIdx !== -1) {
      result = result.slice(0, buildTypesIdx) + splitsBlock + '\n    ' + result.slice(buildTypesIdx);
    }
  }

  // Insert release signingConfig inside signingConfigs {
  const debugKeystoreIdx = result.indexOf("keyPassword 'android'");
  if (debugKeystoreIdx !== -1) {
    const debugCloseBrace = result.indexOf('}', debugKeystoreIdx);
    if (debugCloseBrace !== -1) {
      result =
        result.slice(0, debugCloseBrace + 1) +
        '\n' +
        signingReleaseBlock +
        result.slice(debugCloseBrace + 1);
    }
  }

  // Update buildTypes.release signingConfig
  const buildTypesIdx = result.indexOf('buildTypes {');
  if (buildTypesIdx !== -1) {
    const releaseBlockIdx = result.indexOf('release {', buildTypesIdx);
    if (releaseBlockIdx !== -1) {
      const nextSigningDebug = result.indexOf(
        'signingConfig signingConfigs.debug',
        releaseBlockIdx
      );
      if (nextSigningDebug !== -1) {
        result =
          result.slice(0, nextSigningDebug) +
          'signingConfig signingConfigs.release' +
          result.slice(
            nextSigningDebug + 'signingConfig signingConfigs.debug'.length
          );
      }
    }
  }

  // Insert applicationVariants block before the closing brace of android {
  const newAndroidIdx = result.indexOf('android {');
  if (newAndroidIdx !== -1) {
    const openBraceIdx = result.indexOf('{', newAndroidIdx);
    let depth = 0;
    let closingBraceIdx = -1;
    for (let i = openBraceIdx; i < result.length; i++) {
      if (result[i] === '{') depth++;
      else if (result[i] === '}') {
        depth--;
        if (depth === 0) {
          closingBraceIdx = i;
          break;
        }
      }
    }
    if (closingBraceIdx !== -1) {
      result =
        result.slice(0, closingBraceIdx) +
        applicationVariantsBlock +
        result.slice(closingBraceIdx);
    }
  }

  // Append task guard at the end
  result = result + '\n' + taskGuardBlock;

  return result;
}

const withCurfew: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, (configWithManifest) => {
    configWithManifest.modResults = modifyAndroidManifest(
      configWithManifest.modResults
    );
    return configWithManifest;
  });

  config = withAppBuildGradle(config, (configWithGradle) => {
    configWithGradle.modResults.contents = modifyAppBuildGradle(
      configWithGradle.modResults.contents
    );
    return configWithGradle;
  });

  config = withDangerousMod(config, [
    'android',
    async (dangerousConfig) => {
      const packageName = dangerousConfig.android?.package || 'com.curfew';
      syncNativeFiles(
        dangerousConfig.modRequest.platformProjectRoot,
        dangerousConfig.modRequest.projectRoot,
        packageName
      );
      return dangerousConfig;
    },
  ]);

  return config;
};

export default withCurfew;
