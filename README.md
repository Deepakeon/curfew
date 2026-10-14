# Curfew

An offline, privacy-first Android app blocker enforcing strict screen-time curfews with hard lockout policies, sub-10ms native overlays, and boot persistence.

[![Platform](https://img.shields.io/badge/platform-Android-3DDC84.svg?style=flat-square&logo=android)](https://www.android.com/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-57-000020.svg?style=flat-square&logo=expo)](https://expo.dev/)
[![Offline First](https://img.shields.io/badge/privacy-100%25_offline-00d084.svg?style=flat-square)](#privacy--design-principles)
[![Tests](https://img.shields.io/badge/tests-76%20passed-brightgreen.svg?style=flat-square)](#testing)

---

## Overview

Curfew is built for people who want strict digital boundaries without loopholes. Unlike standard screen-time utilities that offer easy bypasses, "remind me in 5 minutes" buttons, or PIN overrides, Curfew implements **Hard Lockout** enforcement. Once a Curfew is active, schedules cannot be altered, Target Apps cannot be removed, and enforcement cannot be paused from within the app.

Curfew runs entirely offline on-device with zero telemetry, zero analytics, zero external network calls, and no account creation.

---

## Core Features

- **Hard Lockout**: Zero in-app bypass mechanisms during an active Curfew Window. Configuration changes, schedule modifications, and Target App removal are strictly disabled until the window closes.
- **Sub-10ms Native Overlay**: Native Kotlin overlay view (`WindowManager.addView`) intercepts Target App launches instantly, eliminating white flashes and UI render lag common in hybrid blockers. Displays a live countdown and single-tap home exit.
- **Curfew Windows with Overnight Support**: Configure recurring weekly schedules (Monday–Sunday) with seamless support for windows that cross midnight (e.g., 22:00 to 07:00).
- **Target App Management**: Select installed applications to enforce with real-time search and filter. System packages and the active default launcher are automatically immune as **Protected Packages**.
- **Foreground Keep-Alive**: Persistent low-overhead Android foreground service with a low-priority status notification keeps the interception engine resident in memory.
- **Boot Restorer**: Automatically restores Foreground Keep-Alive and re-evaluates active Curfews immediately after device restarts (`RECEIVE_BOOT_COMPLETED`).
- **Uninstall Escape Hatch**: Intentionally avoids Device Administrator permissions and anti-uninstall shields. Users can always uninstall Curfew via standard Android Settings if an emergency occurs, preventing dangerous device lockout.
- **Raycast-Inspired Dark UI**: Polished, distraction-free matte dark-canvas design tokens (`#07080a`) with high-contrast state indicators.

---

## Architecture

Curfew combines React Native (for UI and schedule configuration) with native Kotlin services (for real-time enforcement and lifecycle resilience) using Expo Config Plugins.

```text
┌────────────────────────────────────────────────────────┐
│                   React Native UI                      │
│   (Schedule Editor, App Selection List, Onboarding)    │
└───────────────────────────┬────────────────────────────┘
                            │
               Shared Preferences (Sync IPC)
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Native Android                      │
│                                                        │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │ CurfewAccessibility-   │  │ CurfewForeground-    │  │
│  │ Service                │  │ Service              │  │
│  │ (Window state change)  │  │ (Process keep-alive) │  │
│  └───────────┬────────────┘  └──────────────────────┘  │
│              │                                         │
│              ▼                                         │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │ CurfewOverlayView      │  │ BootReceiver         │  │
│  │ (Sub-10ms native view) │  │ (Reboot persistence) │  │
│  └────────────────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1. **Accessibility Service (`CurfewAccessibilityService`)**: Observes window state transitions (`TYPE_WINDOW_STATE_CHANGED`). When a Target App package is launched during an active Curfew, it immediately deploys the Curfew Overlay.
2. **Synchronous State Sync (`SharedPreferences`)**: Target app lists and curfew window bounds are synced directly via Android `SharedPreferences`, ensuring zero IPC latency during accessibility event evaluation.
3. **Native Overlay (`CurfewOverlayView`)**: Injected directly into Android `WindowManager` as a `TYPE_APPLICATION_OVERLAY`. Renders countdown clock and blocks touch passthrough to the target app.
4. **Boot Receiver (`BootReceiver`)**: Catches boot broadcasts and re-initializes `CurfewForegroundService` to ensure schedules continue unhindered after reboot.

---

## Domain Concepts

To maintain architectural clarity, the codebase uses canonical domain language:

| Concept | Definition | Avoid |
|---|---|---|
| **Curfew** | Restricted time window during which Target Apps cannot be launched | Lock period, block schedule, downtime |
| **Target App** | Installed Android application selected by user for Curfew enforcement | Blocked app, blacklisted app, locked package |
| **Hard Lockout** | Curfew policy strictly prohibiting in-app bypass or modifications while active | Strict mode, no-bypass mode |
| **Curfew Overlay** | Full-screen system overlay window displaying remaining countdown and exit button | Block screen, lock dialog |
| **Uninstall Escape Hatch** | Deliberate design permitting normal uninstall via Android Settings without shields | Tamper shield, anti-uninstall |
| **Protected Package** | Package immune from Target App designation (Curfew and active default launcher) | Whitelisted app, system exemption |
| **Curfew Window** | Recurring time interval bounded by start/end times across selected weekdays | Block slot, schedule range |
| **Foreground Keep-Alive** | Persistent Android foreground service maintaining high process priority | Background daemon, heartbeat service |
| **Boot Restorer** | Broadcast receiver restoring keep-alive service and schedules on device restart | Startup service, boot listener |
| **Curfew Notification** | Minimal low-priority persistent status notification required by Android | Status alert, lock notification |

---

## Permissions & System Requirements

Curfew requires three specific Android permissions to function reliably:

1. **Accessibility Service**: Required to detect when Target Apps transition into the foreground.
2. **Display Over Other Apps (`SYSTEM_ALERT_WINDOW`)**: Required to project the full-screen Curfew Overlay countdown over target apps.
3. **Battery Optimization Exemption**: Required to prevent Android battery managers from putting the background keep-alive process to sleep.

### Android 13+ Restricted Settings

On Android 13 (API 33) and newer, sideloaded applications have Accessibility Service toggles grayed out by default under "Restricted Settings". Curfew provides an integrated onboarding guide:
1. Open Android **Settings > Apps > Curfew**.
2. Tap the three dots (⋮) in the top-right corner.
3. Select **Allow restricted settings**.
4. Authenticate with your device lock, then return to Curfew to grant Accessibility access.

---

## Development

### Prerequisites

- **Node.js**: v18.x or v20.x+
- **JDK**: Java Development Kit 17
- **Android SDK**: Android 14 (API 34) platform tools & build tools
- **Expo CLI**: Bundled with `npx expo`

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/curfew.git
cd curfew

# Install dependencies
npm install
```

### Running Locally

```bash
# Typecheck TypeScript codebase
npm run typecheck

# Run unit and integration tests
npm test

# Generate native android project via Expo config plugins
npm run prebuild

# Launch Android debug build on connected device/emulator
npm run android:debug

# Launch Android release build locally
npm run android:release
```

### Gradle APK Commands

```bash
# Build Debug APK directly
npm run build:android:debug

# Build Release APK directly (requires valid keystore.properties)
npm run build:android:release
```

---

## Privacy & Design Principles

- **No Network Requests**: Curfew does not request network privileges for runtime operation and contains zero remote API endpoints.
- **No Data Collection**: Target app selections and schedules remain 100% on-device in private Android storage.
- **Safety by Design**: By omitting Device Administration interception shields, users retain final ownership of their devices via normal uninstallation in Android Settings.

---

## License

This project is licensed under the [Apache License 2.0](LICENSE)
