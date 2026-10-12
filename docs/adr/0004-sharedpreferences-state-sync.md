# SharedPreferences for Native Interception State Sync

Used Android `SharedPreferences` to synchronize Target Apps and Curfew Windows between React Native UI and native `AccessibilityService`. Ensures synchronous zero-overhead lookup within `AccessibilityService.onAccessibilityEvent` without SQLite IPC latency.
