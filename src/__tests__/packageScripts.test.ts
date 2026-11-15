import * as fs from 'fs';
import * as path from 'path';

describe('package.json scripts configuration', () => {
  const packageJsonPath = path.join(__dirname, '../../package.json');

  it('defines scripts for building all and individual ABI release APKs', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = pkg.scripts;

    expect(scripts['build:android:release:all']).toBeDefined();
    expect(scripts['build:android:release:all']).toContain('assembleRelease');

    expect(scripts['build:android:release:arm64']).toBeDefined();
    expect(scripts['build:android:release:arm64']).toContain('arm64-v8a');

    expect(scripts['build:android:release:arm32']).toBeDefined();
    expect(scripts['build:android:release:arm32']).toContain('armeabi-v7a');

    expect(scripts['build:android:release:x86_64']).toBeDefined();
    expect(scripts['build:android:release:x86_64']).toContain('x86_64');

    expect(scripts['build:android:release:x86']).toBeDefined();
    expect(scripts['build:android:release:x86']).toContain('x86');

    expect(scripts['build:android:release:universal']).toBeDefined();
    expect(scripts['build:android:release:universal']).toContain('enableSplits=false');
  });
});
