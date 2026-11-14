# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Individuals seeking unbreakable discipline against doomscrolling and late-night phone usage. Users are looking for hard behavioral boundaries to enforce sleep schedules or deep focus when willpower fails.

## Product Purpose

Curfew is an offline Android app blocker that enforces strict screen-time curfews. It cuts off access to distracting target apps during defined curfew windows to restore control over time and attention.

## Positioning

Radically offline, unbypassable local enforcement. Unlike competing digital detox apps, Curfew requires no account, sends no telemetry, and provides no mid-curfew override, pause buttons, or bypass mechanics. The only escape hatch is standard Android app uninstallation via Settings.

## Operating Context

- Mobile Android device (Android 10+ / API 29+).
- Operates primarily during bedtime, late evening, or scheduled focus blocks.
- Works quietly via a persistent low-priority foreground service (`Foreground Keep-Alive`) and boot receiver (`Boot Restorer`).
- Immediate interception upon opening a target app via a system overlay window (`Curfew Overlay`) displaying countdown timer and exit button.

## Capabilities and Constraints

- **Hard Lockout**: Strictly prohibits in-app schedule edits, disabling, or bypass while a curfew is active.
- **Curfew Windows**: Start and end times recurring on selected days of the week, supporting overnight spans across midnight.
- **Target Apps**: Installed user applications designated for curfew enforcement.
- **Protected Packages**: System launcher and Curfew itself cannot be targeted.
- **Uninstall Escape Hatch**: Deliberate lack of Device Admin or anti-uninstall shields; user can uninstall via system settings if truly necessary.
- **Fully Offline**: Zero network calls, zero accounts, local SQLite/file storage.

## Brand Commitments

- **Tone**: Austere, calm, unyielding, disciplined, respectful of user autonomy.
- **Design Language**: Dark-canvas Raycast-inspired aesthetic (pure-near-black `#07080a`, hairline borders `#242728`, crisp Inter typography, high-contrast monospace countdowns, minimal distraction).

## Evidence on Hand

- Domain model documented in `CONTEXT.md`.
- Design tokens and component specifications documented in `DESIGN.md`.
- Android native modules and Expo integration code in repository.

## Product Principles

1. **Unbreakable by Design**: No emergency passcodes, cooldown pauses, or soft snooze triggers during an active curfew.
2. **Zero Invasiveness Beyond the Boundary**: Curfew only intercepts target apps during active windows; never tracks usage, logs app history, or phones home.
3. **Respectful Friction**: The friction is absolute within the app, but uninstallation via system settings remains untouched as a respectful escape hatch.
4. **Resilient Background Execution**: Reliable enforcement surviving device reboots and aggressive Android background memory management.

## Accessibility & Inclusion

- High contrast text conforming to WCAG AA/AAA on dark backgrounds.
- Clear, tactile touch targets (minimum 48x48dp) for overlay exit actions.
- Screen reader-friendly labels for time pickers and app selection lists.
