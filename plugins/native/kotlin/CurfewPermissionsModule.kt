package com.curfew

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
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
        val accessibilityGranted = isAccessibilityServiceEnabled()
        val overlayGranted = isOverlayPermissionGranted()
        val batteryIgnored = isBatteryOptimizationIgnored()
        val allGranted = accessibilityGranted && overlayGranted && batteryIgnored

        return Arguments.createMap().apply {
            putBoolean("accessibility", accessibilityGranted)
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
    fun openAccessibilitySettings(promise: Promise) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivityIntent(intent, promise)
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

    private fun isAccessibilityServiceEnabled(): Boolean {
        try {
            val accessibilityManager = reactContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
            val enabledServicesList = accessibilityManager?.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK
            )
            if (enabledServicesList != null) {
                for (service in enabledServicesList) {
                    val serviceInfo = service.resolveInfo?.serviceInfo
                    if (serviceInfo != null &&
                        serviceInfo.packageName.equals(reactContext.packageName, ignoreCase = true) &&
                        (serviceInfo.name.endsWith("CurfewAccessibilityService") ||
                         serviceInfo.name.equals(".CurfewAccessibilityService", ignoreCase = true))
                    ) {
                        return true
                    }
                }
            }

            val accessibilityEnabled = Settings.Secure.getInt(
                reactContext.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED,
                0
            )
            if (accessibilityEnabled != 1) {
                return false
            }

            val expectedServiceName = "${reactContext.packageName}/.CurfewAccessibilityService"
            val expectedFullServiceName = "${reactContext.packageName}/${reactContext.packageName}.CurfewAccessibilityService"
            val enabledServices = Settings.Secure.getString(
                reactContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val enabledServiceComponents = enabledServices.split(":")
            for (component in enabledServiceComponents) {
                val trimmed = component.trim()
                if (trimmed.equals(expectedServiceName, ignoreCase = true) ||
                    trimmed.equals(expectedFullServiceName, ignoreCase = true) ||
                    (trimmed.startsWith("${reactContext.packageName}/", ignoreCase = true) &&
                     trimmed.endsWith("CurfewAccessibilityService", ignoreCase = true))
                ) {
                    return true
                }
            }
        } catch (_: Exception) {
            return false
        }
        return false
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
