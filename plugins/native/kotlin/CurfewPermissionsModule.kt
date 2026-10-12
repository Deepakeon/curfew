package com.curfew

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

class CurfewPermissionsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CurfewPermissions"

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val accessibilityGranted = isAccessibilityServiceEnabled()
            val overlayGranted = isOverlayPermissionGranted()
            val batteryIgnored = isBatteryOptimizationIgnored()
            val allGranted = accessibilityGranted && overlayGranted && batteryIgnored

            val map = Arguments.createMap().apply {
                putBoolean("accessibility", accessibilityGranted)
                putBoolean("overlay", overlayGranted)
                putBoolean("batteryIgnored", batteryIgnored)
                putBoolean("allGranted", allGranted)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSIONS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactContext.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                Intent(Settings.ACTION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openBatteryOptimizationSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:${reactContext.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            try {
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(fallbackIntent)
                promise.resolve(true)
            } catch (fallbackError: Exception) {
                promise.reject("OPEN_SETTINGS_ERROR", fallbackError.message, fallbackError)
            }
        }
    }

    @ReactMethod
    fun openAppInfoSettings(promise: Promise) {
        try {
            val intent = Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:${reactContext.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_ERROR", e.message, e)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expectedServiceName = "${reactContext.packageName}/.CurfewAccessibilityService"
        val expectedFullServiceName = "${reactContext.packageName}/${reactContext.packageName}.CurfewAccessibilityService"
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = enabledServices.split(":")
        for (component in colonSplitter) {
            if (component.equals(expectedServiceName, ignoreCase = true) ||
                component.equals(expectedFullServiceName, ignoreCase = true)
            ) {
                return true
            }
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
