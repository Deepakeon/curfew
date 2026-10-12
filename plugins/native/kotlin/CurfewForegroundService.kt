package com.curfew

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log

class CurfewForegroundService : Service() {

    companion object {
        private const val TAG = "CurfewKeepAlive"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "curfew_keep_alive_channel"
        const val CHANNEL_NAME = "Curfew Keep-Alive"

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
    }

    override fun onCreate() {
        super.onCreate()
        startKeepAliveForeground()
        Log.i(TAG, "Curfew Foreground Keep-Alive service initialized")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startKeepAliveForeground()
        return START_STICKY
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
        super.onDestroy()
    }
}
