# Curfew Domain Model

Offline Android app blocker enforcing strict screen-time curfews.

## Language

**Curfew**:
Restricted time window during which Target Apps cannot be launched.
_Avoid_: Lock period, block schedule, downtime

**Target App**:
Installed Android application selected by user for Curfew enforcement.
_Avoid_: Blocked app, blacklisted app, locked package

**Hard Lockout**:
Curfew policy strictly prohibiting in-app bypass or schedule modifications while active.
_Avoid_: Strict mode, no-bypass mode

**Curfew Overlay**:
Full-screen system overlay window displaying remaining Curfew countdown and exit button when Target App opened.
_Avoid_: Block screen, lock dialog

**Uninstall Escape Hatch**:
Deliberate design permitting normal uninstallation via Android Settings without Device Admin or interception shields.
_Avoid_: Tamper shield, anti-uninstall

**Protected Package**:
Application package immune from being designated as a Target App (specifically Curfew and the active default launcher).
_Avoid_: Whitelisted app, system exemption

**Curfew Window**:
Time interval bounded by start and end times recurring on selected days of the week (Monday–Sunday), supporting overnight crossing across midnight.
_Avoid_: Block slot, schedule range, calendar dates


**Foreground Keep-Alive**:
Persistent Android foreground service maintaining high OS process priority to prevent background termination.
_Avoid_: Background daemon, heartbeat service

**Boot Restorer**:
Broadcast receiver restoring Foreground Keep-Alive and re-evaluating active Curfew on device restart.
_Avoid_: Startup service, boot listener

**Curfew Notification**:
Minimal low-priority persistent status notification required by Android to keep Foreground Keep-Alive resident.
_Avoid_: Status alert, lock notification


