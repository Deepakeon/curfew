package com.curfew

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap

class CurfewPermissionsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CurfewPermissions"

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun checkPermissionsSync(): WritableMap {
        try {
            CurfewForegroundService.start(reactContext)
        } catch (_: Exception) {}

        val usageAccessGranted = isUsageAccessGranted()
        val overlayGranted = isOverlayPermissionGranted()
        val batteryIgnored = isBatteryOptimizationIgnored()
        val allGranted = usageAccessGranted && overlayGranted && batteryIgnored

        return Arguments.createMap().apply {
            putBoolean("usageAccess", usageAccessGranted)
            putBoolean("accessibility", usageAccessGranted)
            putBoolean("overlay", overlayGranted)
            putBoolean("batteryIgnored", batteryIgnored)
            putBoolean("allGranted", allGranted)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val map = checkPermissionsSync()
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSIONS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Intent(
                    Settings.ACTION_USAGE_ACCESS_SETTINGS,
                    Uri.parse("package:${reactContext.packageName}")
                )
            } else {
                Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            }
            startActivityIntent(intent, promise)
        } catch (_: Exception) {
            val fallbackIntent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            startActivityIntent(fallbackIntent, promise)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        openUsageAccessSettings(promise)
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            )
        } else {
            Intent(Settings.ACTION_SETTINGS)
        }
        startActivityIntent(intent, promise)
    }

    @ReactMethod
    fun openBatteryOptimizationSettings(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:${reactContext.packageName}")
                )
                startActivityIntent(intent, promise)
                return
            } catch (_: Exception) {
                // Fallback to battery ignore settings
            }
        }
        val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        startActivityIntent(fallbackIntent, promise)
    }

    @ReactMethod
    fun openAppInfoSettings(promise: Promise) {
        val intent = Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:${reactContext.packageName}")
        )
        startActivityIntent(intent, promise)
    }

    private fun startActivityIntent(intent: Intent, promise: Promise) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_ERROR", e.message, e)
        }
    }

    private fun isUsageAccessGranted(): Boolean {
        return try {
            val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactContext.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        } catch (_: Exception) {
            false
        }
    }

    private fun isOverlayPermissionGranted(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else {
            true
        }
    }

    private fun isBatteryOptimizationIgnored(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
            powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: false
        } else {
            true
        }
    }
}
