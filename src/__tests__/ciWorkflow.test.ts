import * as fs from 'fs';
import * as path from 'path';

describe('CI/CD Release Workflow Configuration', () => {
  const workflowPath = path.join(
    __dirname,
    '../../.github/workflows/build-release-apk.yml'
  );
  const readmePath = path.join(__dirname, '../../README.md');

  it('workflow file exists and contains valid structure', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
    const content = fs.readFileSync(workflowPath, 'utf8');

    // Workflow name and manual trigger
    expect(content).toContain('name:');
    expect(content).toContain('workflow_dispatch:');
    expect(content).not.toContain('push:');

    // Essential toolchain setup
    expect(content).toContain('actions/checkout@v4');
    expect(content).toContain('actions/setup-node@v4');
    expect(content).toContain('actions/setup-java@v4');
    expect(content).toContain('java-version:');
    expect(content).toContain("'17'");
    expect(content).toContain('gradle/actions/setup-gradle@v4');

    // Expo prebuild step
    expect(content).toContain('expo prebuild');

    // Secrets handling & decoding
    expect(content).toContain('ANDROID_KEYSTORE_BASE64');
    expect(content).toContain('KEYSTORE_PASSWORD');
    expect(content).toContain('KEY_ALIAS');
    expect(content).toContain('KEY_PASSWORD');
    expect(content).toContain('base64 --decode');

    // Build execution & Gradle release assemble
    expect(content).toContain('./gradlew assembleRelease');

    // Guaranteed cleanup
    expect(content).toContain('always()');
    expect(content).toContain('rm -f');

    // Artifact upload
    expect(content).toContain('actions/upload-artifact@v4');
    expect(content).toContain('app-release.apk');
  });

  it('README.md includes documentation for required CI secrets and release workflow', () => {
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf8');

    expect(content).toContain('ANDROID_KEYSTORE_BASE64');
    expect(content).toContain('KEYSTORE_PASSWORD');
    expect(content).toContain('KEY_ALIAS');
    expect(content).toContain('KEY_PASSWORD');
    expect(content).toContain('base64');
  });
});
