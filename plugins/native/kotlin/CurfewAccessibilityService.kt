package com.curfew

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class CurfewAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Interception logic will be implemented in Ticket #5
    }

    override fun onInterrupt() {
    }
}
