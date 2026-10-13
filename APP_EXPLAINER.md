# Curfew App Explainer (Android)

This document audits how Curfew currently enforces app blocks on Android, which permissions it depends on, and where reliability gaps still exist.

## 1) App mechanics and enforcement flow

### Core runtime components

- `CurfewAccessibilityService` (`plugins/native/kotlin/CurfewAccessibilityService.kt`)
  - Listens for `TYPE_WINDOW_STATE_CHANGED` events.
  - Reads target package list from shared prefs (`CurfewAppsModule.KEY_TARGET_PACKAGES`).
  - Checks whether curfew is active now via `CurfewScheduleModule.checkCurfewActiveNow(...)`.
  - Shows/removes native overlay accordingly.
- `CurfewScheduleModule` (`plugins/native/kotlin/CurfewScheduleModule.kt`)
  - Stores curfew schedule in `SharedPreferences` (`curfew_prefs`).
  - Computes active curfew windows, including overnight ranges.
- `CurfewOverlayView` (`plugins/native/kotlin/CurfewOverlayView.kt`)
  - Native full-screen blocking UI with countdown and "Exit to Home".
- `CurfewForegroundService` + `BootReceiver`
  - Keep-alive foreground process + boot restore path.

### Detection → verification → overlay lifecycle

```mermaid
flowchart LR
  A[Foreground app change\nAccessibility TYPE_WINDOW_STATE_CHANGED] --> B{Protected/system/self app?}
  B -- Yes --> C[Remove/skip overlay]
  B -- No --> D[Load target apps + schedule from SharedPreferences]
  D --> E{Curfew active AND package targeted?}
  E -- Yes --> F[Show native overlay\n(TYPE_ACCESSIBILITY_OVERLAY)]
  E -- No --> C
  F --> G[Per-second countdown refresh]
  G --> H{Curfew ended or user exits to Home?}
  H -- Yes --> C
```

## 2) Permission justifications (manifest audit)

`AndroidManifest.xml` is generated/mutated by `plugins/withCurfew.ts` (`modifyAndroidManifest`).

### `android.permission.BIND_ACCESSIBILITY_SERVICE`

- **Declared as:** service permission on `.CurfewAccessibilityService`.
- **Why needed:** allows Android to bind Curfew as an accessibility service, enabling real-time foreground package detection.
- **Failure behavior:** if service not enabled/bound, Curfew cannot observe foreground app transitions; hard blocking cannot trigger.

### `android.permission.SYSTEM_ALERT_WINDOW`

- **Declared as:** app-level `uses-permission`.
- **Why needed (current product contract):** onboarding and permission checks treat display-over-apps capability as required for reliable blocking UX.
- **Platform behavior note:** runtime overlay rendering is currently via `TYPE_ACCESSIBILITY_OVERLAY` inside the accessibility service.
- **Failure behavior:** permission state remains incomplete in onboarding (`allGranted = false`), reducing setup completion and potentially block-surface reliability on OEM variants.

### `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`

- **Declared as:** app-level `uses-permission`.
- **Why needed:** requests exemption from Doze/app standby so accessibility + keep-alive behavior survives overnight and idle periods.
- **Failure behavior:** OEM/Android power management can throttle or kill supporting processes, causing delayed/missed enforcement until user reopens app or service is revived.

### Secondary permissions

#### `android.permission.RECEIVE_BOOT_COMPLETED`

- **Declared as:** app-level `uses-permission`; paired with `.BootReceiver` for `BOOT_COMPLETED`.
- **Why needed:** restores `CurfewForegroundService` after reboot.
- **Failure behavior:** after device restart, persistence path does not auto-recover until manual app launch.

#### `PACKAGE_USAGE_STATS` (currently **not** declared)

- **Current state:** no declaration/request in current codebase.
- **Potential role:** could support fallback foreground attribution using `UsageStatsManager` when accessibility signal quality is degraded.
- **Failure behavior today:** Curfew relies primarily on accessibility events; no usage-stats fallback exists.

## 3) Edge cases and platform constraints (API 29+)

- **OEM background killers (MIUI/Samsung/OnePlus):**
  - Even with foreground service + battery-ignore request, vendor task killers may still suspend behavior.
  - Accessibility service can be silently disabled during "optimization" flows.

- **Overlay latency and bypass vectors:**
  - First frame race: a blocked app can render briefly before overlay attach on some devices.
  - Split-screen/PiP/multi-window can produce ambiguous foreground transitions and reduce deterministic interception.
  - Force stop of Curfew disables all enforcement until manual relaunch.
  - Permission revocation (accessibility/overlay/battery-ignore) creates partial-failure states.

- **Google Play Accessibility policy risk:**
  - Accessibility use must remain narrowly scoped to user-facing wellbeing/accessibility-adjacent purpose.
  - Onboarding/disclosure must clearly explain data usage, scope, and user control to reduce policy rejection risk.

## 4) Improvement roadmap

### Resiliency

1. Add optional `UsageStatsManager` fallback (`PACKAGE_USAGE_STATS`) for degraded accessibility event scenarios.
2. Add periodic health checks (e.g., `WorkManager`) to detect disabled permissions/services and surface recovery prompts.
3. Persist and report enforcement health state (service active, last event time, last overlay success).

### Anti-tampering / bypass reduction

1. Detect service interruption and immediately notify user with high-priority remediation CTA.
2. Harden split-screen/PiP handling with explicit UX rules (block, warn, or cooldown fallback).
3. Add revocation watchers and explicit "protection degraded" mode.

### Onboarding and trust

1. Expand permission education with per-permission failure impact (what breaks if denied).
2. Add OEM-specific setup guides (Auto-start, battery whitelist, lock task in recents) for major vendors.
3. Add in-app diagnostics page to self-check all enforcement prerequisites.

### Alternate block modes

1. Soft-block mode (warning + delay before hard lock).
2. Cooldown mode (timed unlock windows).
3. Emergency pause with explicit timeout + audit trail.

---

## Source map (quick links)

- Manifest mutation and permission declarations: `plugins/withCurfew.ts`
- Accessibility detection and overlay trigger: `plugins/native/kotlin/CurfewAccessibilityService.kt`
- Overlay rendering: `plugins/native/kotlin/CurfewOverlayView.kt`
- Schedule computation: `plugins/native/kotlin/CurfewScheduleModule.kt`
- Permission checks/settings intents: `plugins/native/kotlin/CurfewPermissionsModule.kt`
- Boot persistence and keep-alive: `plugins/native/kotlin/BootReceiver.kt`, `plugins/native/kotlin/CurfewForegroundService.kt`
- Permission onboarding UI: `src/components/OnboardingWizard.tsx`
