package com.curfew

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.WindowManager

class CurfewForegroundService : Service() {

    companion object {
        private const val TAG = "CurfewKeepAlive"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "curfew_keep_alive_channel"
        const val CHANNEL_NAME = "Curfew Keep-Alive"
        private const val POLLING_INTERVAL_MS = 250L
        private const val SCHEDULE_CHECK_INTERVAL_MS = 5000L

        private const val SYSTEM_UI_PACKAGE = "com.android.systemui"
        private const val ANDROID_PACKAGE = "android"

        // Protected packages immune from interception (Uninstall Escape Hatch)
        val PROTECTED_PACKAGES = setOf(
            "com.android.settings",
            "com.android.packageinstaller",
            "com.google.android.packageinstaller"
        )

        private var instance: CurfewForegroundService? = null

        fun start(context: Context) {
            val intent = Intent(context, CurfewForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, CurfewForegroundService::class.java)
            context.stopService(intent)
        }

        fun evaluateState(context: Context) {
            instance?.evaluatePollingState() ?: start(context)
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: CurfewOverlayView? = null
    private var isOverlayShown = false
    private val mainHandler = Handler(Looper.getMainLooper())

    private var pollingThread: HandlerThread? = null
    private var pollingHandler: Handler? = null
    private var isPollingActive = false

    private var isScreenVisible = true
    private var screenReceiver: BroadcastReceiver? = null
    private var currentForegroundPackage: String? = null

    private val countdownRunnable = object : Runnable {
        override fun run() {
            if (!isOverlayShown) return
            val remainingMillis = CurfewScheduleModule.getRemainingCurfewMillis(this@CurfewForegroundService)
            if (remainingMillis <= 0L) {
                removeOverlay()
                return
            }
            overlayView?.setRemainingTime(CurfewScheduleModule.formatRemainingTime(remainingMillis))
            mainHandler.postDelayed(this, 1000)
        }
    }

    private val pollingRunnable = object : Runnable {
        override fun run() {
            val isInteractive = checkScreenInteractive()
            isScreenVisible = isInteractive
            val isCurfewActive = CurfewScheduleModule.checkCurfewActiveNow(this@CurfewForegroundService)

            if (!isScreenVisible || !isCurfewActive) {
                stopPolling()
                if (!isCurfewActive) {
                    removeOverlay()
                }
                if (isScreenVisible && !isCurfewActive) {
                    scheduleNextCurfewCheck()
                }
                return
            }

            pollForegroundApp()
            pollingHandler?.postDelayed(this, POLLING_INTERVAL_MS)
        }
    }

    private val curfewCheckRunnable = object : Runnable {
        override fun run() {
            val isInteractive = checkScreenInteractive()
            isScreenVisible = isInteractive
            if (!isScreenVisible) {
                stopCurfewScheduleCheck()
                return
            }
            val isCurfewActive = CurfewScheduleModule.checkCurfewActiveNow(this@CurfewForegroundService)
            if (isCurfewActive) {
                stopCurfewScheduleCheck()
                startPolling()
            } else {
                pollingHandler?.postDelayed(this, SCHEDULE_CHECK_INTERVAL_MS)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        startKeepAliveForeground()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager

        val thread = HandlerThread("CurfewUsagePollingThread").apply { start() }
        pollingThread = thread
        pollingHandler = Handler(thread.looper)

        registerScreenReceiver()
        evaluatePollingState()
        Log.i(TAG, "Curfew Foreground Keep-Alive service initialized")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startKeepAliveForeground()
        evaluatePollingState()
        return START_STICKY
    }

    private fun checkScreenInteractive(): Boolean {
        return try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            pm?.isInteractive ?: true
        } catch (_: Exception) {
            true
        }
    }

    private fun registerScreenReceiver() {
        if (screenReceiver != null) return
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    Intent.ACTION_SCREEN_ON, Intent.ACTION_USER_PRESENT -> {
                        isScreenVisible = true
                        evaluatePollingState()
                    }
                    Intent.ACTION_SCREEN_OFF -> {
                        isScreenVisible = false
                        evaluatePollingState()
                    }
                }
            }
        }
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        registerReceiver(receiver, filter)
        screenReceiver = receiver
    }

    private fun unregisterScreenReceiver() {
        screenReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {}
            screenReceiver = null
        }
    }

    fun evaluatePollingState() {
        val isInteractive = checkScreenInteractive()
        isScreenVisible = isInteractive
        val isCurfewActive = CurfewScheduleModule.checkCurfewActiveNow(this)

        if (isScreenVisible && isCurfewActive) {
            stopCurfewScheduleCheck()
            startPolling()
        } else {
            stopPolling()
            if (!isCurfewActive) {
                removeOverlay()
                if (isScreenVisible) {
                    scheduleNextCurfewCheck()
                } else {
                    stopCurfewScheduleCheck()
                }
            } else {
                stopCurfewScheduleCheck()
            }
        }
    }

    @Synchronized
    private fun startPolling() {
        if (isPollingActive) return
        isPollingActive = true
        pollingHandler?.removeCallbacks(pollingRunnable)
        pollingHandler?.post(pollingRunnable)
        Log.d(TAG, "Usage Access app-detection polling started")
    }

    @Synchronized
    private fun stopPolling() {
        if (!isPollingActive) return
        isPollingActive = false
        pollingHandler?.removeCallbacks(pollingRunnable)
        Log.d(TAG, "Usage Access app-detection polling stopped")
    }

    private fun scheduleNextCurfewCheck() {
        pollingHandler?.removeCallbacks(curfewCheckRunnable)
        pollingHandler?.postDelayed(curfewCheckRunnable, SCHEDULE_CHECK_INTERVAL_MS)
    }

    private fun stopCurfewScheduleCheck() {
        pollingHandler?.removeCallbacks(curfewCheckRunnable)
    }

    private fun pollForegroundApp() {
        try {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return
            val endTime = System.currentTimeMillis()
            val startTime = endTime - 10_000L
            val events = usageStatsManager.queryEvents(startTime, endTime) ?: return
            val event = UsageEvents.Event()
            var latestPkg: String? = null
            var latestTimestamp = 0L

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED && event.timeStamp >= latestTimestamp) {
                    latestPkg = event.packageName
                    latestTimestamp = event.timeStamp
                }
            }

            if (latestPkg != null) {
                currentForegroundPackage = latestPkg
            }

            val pkg = currentForegroundPackage ?: return
            handlePackageInterception(pkg)
        } catch (e: Exception) {
            Log.e(TAG, "Error querying UsageStatsManager", e)
        }
    }

    private fun handlePackageInterception(packageName: String) {
        if (packageName == SYSTEM_UI_PACKAGE || packageName == ANDROID_PACKAGE || isInputMethod(packageName)) {
            return
        }

        if (PROTECTED_PACKAGES.contains(packageName)) {
            removeOverlay()
            return
        }

        if (packageName == this.packageName || packageName == CurfewAppsModule.HARDCODED_CURFEW_PACKAGE) {
            val isCurfewActive = CurfewScheduleModule.checkCurfewActiveNow(this)
            if (isCurfewActive) {
                showOverlay()
            } else {
                removeOverlay()
            }
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

    private fun isInputMethod(packageName: String): Boolean {
        return try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? android.view.inputmethod.InputMethodManager
            imm?.enabledInputMethodList?.any { it.packageName == packageName } ?: false
        } catch (_: Exception) {
            false
        }
    }

    private fun showOverlay() {
        runOnMainThread {
            if (isOverlayShown) {
                updateCountdown()
                return@runOnMainThread
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                Log.w(TAG, "Cannot show overlay: SYSTEM_ALERT_WINDOW not granted")
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

            val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                overlayType,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                }
            }

            try {
                wm.addView(view, layoutParams)
                isOverlayShown = true
                mainHandler.post(countdownRunnable)
                Log.d(TAG, "Curfew overlay displayed via ForegroundService")
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

    private fun startKeepAliveForeground() {
        createNotificationChannel()

        val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        val appIcon = applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_lock_idle_lock

        val notification = notificationBuilder
            .setContentTitle("Curfew")
            .setContentText("Curfew Keep-Alive active")
            .setSmallIcon(appIcon)
            .setOngoing(true)
            .apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                    @Suppress("DEPRECATION")
                    setPriority(Notification.PRIORITY_LOW)
                }
            }
            .build()

        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            Log.d(TAG, "Curfew Keep-Alive running with low-priority notification")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start foreground service", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val existing = manager?.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Persistent Curfew Keep-Alive status notification"
                    setShowBadge(false)
                    setSound(null, null)
                    enableVibration(false)
                }
                manager?.createNotificationChannel(channel)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        Log.i(TAG, "Curfew Foreground Keep-Alive service destroyed")
        instance = null
        unregisterScreenReceiver()
        stopPolling()
        stopCurfewScheduleCheck()
        removeOverlay()
        pollingThread?.quitSafely()
        pollingThread = null
        pollingHandler = null
        super.onDestroy()
    }
}
