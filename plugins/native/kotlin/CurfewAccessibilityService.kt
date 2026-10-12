package com.curfew

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent

class CurfewAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "CurfewAccessibility"
        private const val SYSTEM_UI_PACKAGE = "com.android.systemui"
        private const val ANDROID_PACKAGE = "android"

        // Protected packages immune from interception (Uninstall Escape Hatch)
        private val PROTECTED_PACKAGES = setOf(
            "com.android.settings",
            "com.android.packageinstaller",
            "com.google.android.packageinstaller"
        )
    }

    private var windowManager: WindowManager? = null
    private var overlayView: CurfewOverlayView? = null
    private var isOverlayShown = false
    private val mainHandler = Handler(Looper.getMainLooper())

    private val countdownRunnable = object : Runnable {
        override fun run() {
            if (!isOverlayShown) return

            val remainingMillis = CurfewScheduleModule.getRemainingCurfewMillis(this@CurfewAccessibilityService)
            if (remainingMillis <= 0L) {
                removeOverlay()
                return
            }

            overlayView?.setRemainingTime(CurfewScheduleModule.formatRemainingTime(remainingMillis))
            mainHandler.postDelayed(this, 1000)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        Log.i(TAG, "CurfewAccessibilityService connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }

        val packageName = event.packageName?.toString() ?: return

        // Ignore temporary system overlays (notification shade, volume sliders, IME)
        if (packageName == SYSTEM_UI_PACKAGE || packageName == ANDROID_PACKAGE) {
            return
        }

        // Always allow Curfew itself, Settings (Uninstall Escape Hatch), and package installers
        if (packageName == this.packageName || PROTECTED_PACKAGES.contains(packageName)) {
            removeOverlay()
            return
        }

        val prefs = getSharedPreferences(CurfewScheduleModule.PREFS_NAME, Context.MODE_PRIVATE)
        val targetPackages = prefs.getStringSet(CurfewAppsModule.KEY_TARGET_PACKAGES, emptySet()) ?: emptySet()
        val isCurfewActive = CurfewScheduleModule.checkCurfewActiveNow(this)

        if (isCurfewActive && targetPackages.contains(packageName)) {
            showOverlay()
        } else {
            removeOverlay()
        }
    }

    private fun showOverlay() {
        runOnMainThread {
            if (isOverlayShown) {
                updateCountdown()
                return@runOnMainThread
            }

            if (windowManager == null) {
                windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            }
            val wm = windowManager ?: return@runOnMainThread

            val view = CurfewOverlayView(this) {
                exitToHome()
            }
            overlayView = view

            updateCountdown()

            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER
            }

            try {
                wm.addView(view, layoutParams)
                isOverlayShown = true
                mainHandler.post(countdownRunnable)
                Log.d(TAG, "Curfew overlay displayed")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to display overlay", e)
                overlayView = null
                isOverlayShown = false
            }
        }
    }

    private fun removeOverlay() {
        runOnMainThread {
            if (!isOverlayShown && overlayView == null) return@runOnMainThread

            mainHandler.removeCallbacks(countdownRunnable)

            try {
                overlayView?.let { view ->
                    windowManager?.removeView(view)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to remove overlay view", e)
            } finally {
                overlayView = null
                isOverlayShown = false
            }
        }
    }

    private fun updateCountdown() {
        val remainingMillis = CurfewScheduleModule.getRemainingCurfewMillis(this)
        overlayView?.setRemainingTime(CurfewScheduleModule.formatRemainingTime(remainingMillis))
    }

    private fun exitToHome() {
        try {
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(homeIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to navigate to Home", e)
        } finally {
            removeOverlay()
        }
    }

    private fun runOnMainThread(action: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            action()
        } else {
            mainHandler.post(action)
        }
    }

    override fun onInterrupt() {
        removeOverlay()
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }
}
