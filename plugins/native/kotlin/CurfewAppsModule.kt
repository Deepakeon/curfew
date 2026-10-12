package com.curfew

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import java.io.ByteArrayOutputStream

class CurfewAppsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val PREFS_NAME = "curfew_prefs"
        const val KEY_TARGET_PACKAGES = "target_packages"
        const val HARDCODED_CURFEW_PACKAGE = "com.curfew"
        const val ICON_SIZE_PX = 64
        const val COMPRESS_QUALITY = 85
    }

    override fun getName(): String = "CurfewApps"

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        Thread {
            try {
                val pm = reactContext.packageManager
                val curfewPackage = reactContext.packageName

                // Identify all device launcher packages to protect them from selection
                val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                val launcherActivities = pm.queryIntentActivities(homeIntent, 0)
                val protectedLauncherPackages = launcherActivities.map {
                    it.activityInfo.packageName
                }.toMutableSet()

                pm.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo?.packageName?.let {
                    protectedLauncherPackages.add(it)
                }

                // Query all launcher apps
                val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
                val resolveInfoList = pm.queryIntentActivities(launcherIntent, 0)

                val appsList = Arguments.createArray()
                val seenPackages = mutableSetOf<String>()

                val sortedList = resolveInfoList.sortedBy {
                    it.loadLabel(pm).toString().lowercase()
                }

                for (info in sortedList) {
                    val pkg = info.activityInfo.packageName
                    if (seenPackages.contains(pkg)) continue
                    if (pkg == curfewPackage || pkg == HARDCODED_CURFEW_PACKAGE) continue
                    if (protectedLauncherPackages.contains(pkg)) continue

                    seenPackages.add(pkg)
                    val label = info.loadLabel(pm).toString()
                    val iconBase64 = try {
                        val iconDrawable = info.loadIcon(pm)
                        drawableToBase64(iconDrawable)
                    } catch (_: Exception) {
                        ""
                    }

                    val appMap = Arguments.createMap().apply {
                        putString("packageName", pkg)
                        putString("label", label)
                        putString("icon", iconBase64)
                    }
                    appsList.pushMap(appMap)
                }

                promise.resolve(appsList)
            } catch (e: Exception) {
                promise.reject("GET_INSTALLED_APPS_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun getTargetApps(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val storedSet = prefs.getStringSet(KEY_TARGET_PACKAGES, emptySet()) ?: emptySet()
            val array = Arguments.createArray()
            for (pkg in storedSet) {
                array.pushString(pkg)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("GET_TARGET_APPS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setTargetApps(packages: ReadableArray, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val newSet = mutableSetOf<String>()
            for (i in 0 until packages.size()) {
                packages.getString(i)?.let { newSet.add(it) }
            }
            // Use commit() to guarantee atomic synchronous write to disk
            val success = prefs.edit().putStringSet(KEY_TARGET_PACKAGES, newSet).commit()
            promise.resolve(success)
        } catch (e: Exception) {
            promise.reject("SET_TARGET_APPS_ERROR", e.message, e)
        }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = when (drawable) {
            is BitmapDrawable -> drawable.bitmap
            else -> {
                val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth.coerceAtMost(ICON_SIZE_PX * 2) else ICON_SIZE_PX
                val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight.coerceAtMost(ICON_SIZE_PX * 2) else ICON_SIZE_PX
                val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bmp)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                bmp
            }
        }
        val scaled = Bitmap.createScaledBitmap(bitmap, ICON_SIZE_PX, ICON_SIZE_PX, true)
        val stream = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.PNG, COMPRESS_QUALITY, stream)
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    }
}
