# Usage Access Permission for Target App Detection

Switched target app detection from Android `AccessibilityService` to `UsageStatsManager` with `PACKAGE_USAGE_STATS`. Eliminates security blocks by banking and UPI payment apps that restrict devices with active accessibility services. Detection polling executes inside `CurfewForegroundService` gated strictly by screen visibility and active Curfew schedule to minimize battery consumption. Overlay is rendered directly via `WindowManager` using `TYPE_APPLICATION_OVERLAY`.
