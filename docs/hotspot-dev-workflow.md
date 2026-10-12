# Hotspot Development Workflow (No Wi-Fi / Charge-Only USB)

Development and live debugging guide when lacking home Wi-Fi and using a charge-only USB cable.

## 1. Network Setup

1. Turn on **Mobile Hotspot** on Android phone.
2. Connect PC to the phone's Wi-Fi hotspot.
3. Find PC IP on the hotspot network:
   ```bash
   hostname -I | awk '{print $1}'
   # typically 192.168.43.x
   ```

## 2. One-Time Dev APK Build & Transfer

1. Build development APK locally:
   ```bash
   npx expo run:android --variant debug
   ```
   Or assemble APK directly via Gradle:
   ```bash
   cd android && ./gradlew assembleDebug && cd ..
   # APK created at: android/app/build/outputs/apk/debug/app-debug.apk
   ```
2. Start temporary local file server on PC:
   ```bash
   python3 -m http.server 8080 --directory android/app/build/outputs/apk/debug/
   ```
3. On phone, open Chrome and navigate to:
   ```
   http://<PC_IP>:8080/app-debug.apk
   ```
4. Download and install APK. Grant Android permissions (Allow restricted settings for Accessibility).

## 3. Live Debugging & Fast Refresh

1. Start Metro bundler bound to LAN:
   ```bash
   npx expo start --host lan
   ```
2. Open installed Curfew dev app on phone.
3. App connects to Metro on PC over hotspot network.
4. UI/logic edits Fast Refresh instantly (<1s). Reinstalling APK is **never** required unless native Kotlin modules or permissions change.
