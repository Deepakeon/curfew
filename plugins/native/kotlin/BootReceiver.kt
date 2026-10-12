package com.curfew

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "CurfewBootReceiver"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.i(TAG, "BOOT_COMPLETED received. Restoring Curfew Foreground Keep-Alive service.")
            try {
                CurfewForegroundService.start(context)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to restore Curfew Foreground Keep-Alive on boot", e)
            }
        }
    }
}
