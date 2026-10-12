# Curfew

Curfew is an offline Android app blocker that enforces strict screen-time curfews with hard lockout policies and boot persistence.

## Development

```bash
# Install dependencies
npm install

# Run typecheck and tests
npm run typecheck
npm test

# Generate native Android project via Expo prebuild
npx expo prebuild --platform android --no-install
```

## Release Builds & CI/CD

### Required GitHub Repository Secrets

To build and sign production release APKs in GitHub Actions, configure the following secrets under **Settings > Secrets and variables > Actions > Repository secrets**:

| Secret Name | Description | Example / Notes |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore file (`.jks` / `.keystore`) | Generated via `base64 -w 0 path/to/keystore.jks` (Linux) or `base64 -i path/to/keystore.jks` (macOS) |
| `KEYSTORE_PASSWORD` | Password for the release keystore | Keystore store password |
| `KEY_ALIAS` | Key alias name inside the keystore | Alias specified when creating the key |
| `KEY_PASSWORD` | Password for the key alias | Alias key password |

#### How to Encode the Keystore File

Generate the base64 string to store in `ANDROID_KEYSTORE_BASE64`:

```bash
# Linux
base64 -w 0 ~/.android/keys/curfew-release.jks

# macOS
base64 -i ~/.android/keys/curfew-release.jks
```

### GitHub Actions Workflow

The release workflow is defined in [`.github/workflows/build-release-apk.yml`](.github/workflows/build-release-apk.yml) and runs on:

- **Version tag push**: `v*.*.*` (e.g. `v1.0.0`)
- **Pushes to `main`**
- **Manual dispatch (`workflow_dispatch`)**: Can be triggered manually from the Actions tab with an optional target branch or tag input.

### Artifacts

Upon successful build completion:
- The runner securely decodes the keystore into runner temporary storage.
- Builds the signed APK using Gradle `assembleRelease`.
- Keystore files are automatically wiped on completion (`if: always()`).
- The signed APK is uploaded and available for download as the `app-release` workflow artifact.
