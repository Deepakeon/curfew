# Native Android View for Curfew Overlay

Implemented Curfew Overlay using a native Kotlin View (`WindowManager.addView`) rather than a React Native UI window. Guarantees sub-10ms render latency upon target app launch, avoiding visual flash of blocked content while the React Native JS thread is backgrounded.
