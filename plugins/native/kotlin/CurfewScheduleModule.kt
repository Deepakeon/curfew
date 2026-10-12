package com.curfew

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.util.Calendar

class CurfewScheduleModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val PREFS_NAME = "curfew_prefs"
        const val KEY_START_HOUR = "curfew_start_hour"
        const val KEY_START_MINUTE = "curfew_start_minute"
        const val KEY_END_HOUR = "curfew_end_hour"
        const val KEY_END_MINUTE = "curfew_end_minute"
        const val KEY_ACTIVE_DAYS = "curfew_active_days"
        const val KEY_ENABLED = "curfew_enabled"

        const val DEFAULT_START_HOUR = 22
        const val DEFAULT_START_MINUTE = 0
        const val DEFAULT_END_HOUR = 10
        const val DEFAULT_END_MINUTE = 0
        val DEFAULT_DAYS = setOf("1", "2", "3", "4", "5", "6", "7")
    }

    override fun getName(): String = "CurfewScheduleModule"

    @ReactMethod
    fun getSchedule(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val startHour = prefs.getInt(KEY_START_HOUR, DEFAULT_START_HOUR)
            val startMinute = prefs.getInt(KEY_START_MINUTE, DEFAULT_START_MINUTE)
            val endHour = prefs.getInt(KEY_END_HOUR, DEFAULT_END_HOUR)
            val endMinute = prefs.getInt(KEY_END_MINUTE, DEFAULT_END_MINUTE)
            val enabled = prefs.getBoolean(KEY_ENABLED, true)
            val daysSet = prefs.getStringSet(KEY_ACTIVE_DAYS, DEFAULT_DAYS) ?: DEFAULT_DAYS

            val daysArray = Arguments.createArray()
            daysSet.mapNotNull { it.toIntOrNull() }.sorted().forEach {
                daysArray.pushInt(it)
            }

            val map = Arguments.createMap().apply {
                putInt("startHour", startHour)
                putInt("startMinute", startMinute)
                putInt("endHour", endHour)
                putInt("endMinute", endMinute)
                putBoolean("enabled", enabled)
                putArray("activeDays", daysArray)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("GET_SCHEDULE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setSchedule(schedule: ReadableMap, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val editor = prefs.edit()

            if (schedule.hasKey("startHour")) {
                editor.putInt(KEY_START_HOUR, schedule.getInt("startHour"))
            }
            if (schedule.hasKey("startMinute")) {
                editor.putInt(KEY_START_MINUTE, schedule.getInt("startMinute"))
            }
            if (schedule.hasKey("endHour")) {
                editor.putInt(KEY_END_HOUR, schedule.getInt("endHour"))
            }
            if (schedule.hasKey("endMinute")) {
                editor.putInt(KEY_END_MINUTE, schedule.getInt("endMinute"))
            }
            if (schedule.hasKey("enabled")) {
                editor.putBoolean(KEY_ENABLED, schedule.getBoolean("enabled"))
            }
            if (schedule.hasKey("activeDays")) {
                val daysArray = schedule.getArray("activeDays")
                val daysSet = mutableSetOf<String>()
                if (daysArray != null) {
                    for (i in 0 until daysArray.size()) {
                        daysSet.add(daysArray.getInt(i).toString())
                    }
                }
                editor.putStringSet(KEY_ACTIVE_DAYS, daysSet)
            }

            // Commit synchronously to guarantee immediate availability for AccessibilityService
            val success = editor.commit()
            promise.resolve(success)
        } catch (e: Exception) {
            promise.reject("SET_SCHEDULE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isCurfewActive(promise: Promise) {
        try {
            val active = checkCurfewActiveNow(reactContext)
            promise.resolve(active)
        } catch (e: Exception) {
            promise.reject("CHECK_CURFEW_ACTIVE_ERROR", e.message, e)
        }
    }

    companion object Helper {
        fun checkCurfewActiveNow(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val enabled = prefs.getBoolean(KEY_ENABLED, true)
            if (!enabled) return false

            val daysSet = prefs.getStringSet(KEY_ACTIVE_DAYS, DEFAULT_DAYS) ?: DEFAULT_DAYS
            if (daysSet.isEmpty()) return false

            val calendar = Calendar.getInstance()
            val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) // 1=Sunday, 2=Monday... 7=Saturday
            val isoDay = if (dayOfWeek == Calendar.SUNDAY) 7 else dayOfWeek - 1
            val prevIsoDay = if (isoDay == 1) 7 else isoDay - 1

            val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

            val startHour = prefs.getInt(KEY_START_HOUR, DEFAULT_START_HOUR)
            val startMinute = prefs.getInt(KEY_START_MINUTE, DEFAULT_START_MINUTE)
            val endHour = prefs.getInt(KEY_END_HOUR, DEFAULT_END_HOUR)
            val endMinute = prefs.getInt(KEY_END_MINUTE, DEFAULT_END_MINUTE)

            val startMinutes = startHour * 60 + startMinute
            val endMinutes = endHour * 60 + endMinute

            if (startMinutes == endMinutes) {
                return daysSet.contains(isoDay.toString())
            }

            if (startMinutes < endMinutes) {
                return daysSet.contains(isoDay.toString()) &&
                        currentMinutes >= startMinutes &&
                        currentMinutes < endMinutes
            }

            // Overnight
            val eveningMatch = currentMinutes >= startMinutes && daysSet.contains(isoDay.toString())
            val morningMatch = currentMinutes < endMinutes && daysSet.contains(prevIsoDay.toString())
            return eveningMatch || morningMatch
        }
    }
}
