package com.curfew

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

class CurfewOverlayView(
    context: Context,
    private val onExitHome: () -> Unit
) : FrameLayout(context) {

    private var countdownValueView: TextView? = null

    init {
        // Dark-canvas root container (#07080a) consuming all touch events
        setBackgroundColor(Color.parseColor("#07080a"))
        isClickable = true
        isFocusable = true
        isFocusableInTouchMode = true
        setOnTouchListener { _, _ -> true }

        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#0d0d0d"))
                cornerRadius = dp(10f).toFloat()
                setStroke(dp(1f), Color.parseColor("#242728"))
            }
            background = bg
            setPadding(dp(24f), dp(24f), dp(24f), dp(24f))
            isClickable = true
        }

        val cardParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER
            leftMargin = dp(24f)
            rightMargin = dp(24f)
        }

        // 1. Status indicator badge: Soft Red Pill with Dot
        val statusPill = TextView(context).apply {
            text = "● CURFEW ACTIVE"
            setTextColor(Color.parseColor("#ff6161"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            val pillBg = GradientDrawable().apply {
                setColor(Color.parseColor("#26ff6161"))
                cornerRadius = dp(4f).toFloat()
                setStroke(dp(1f), Color.parseColor("#40ff6161"))
            }
            background = pillBg
            setPadding(dp(10f), dp(4f), dp(10f), dp(4f))
            gravity = Gravity.CENTER
        }
        val statusParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(16f)
        }
        card.addView(statusPill, statusParams)

        // 2. Title: Target App Restricted
        val titleView = TextView(context).apply {
            text = "Target App Restricted"
            setTextColor(Color.parseColor("#f4f4f6"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        val titleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(8f)
        }
        card.addView(titleView, titleParams)

        // 3. Subtitle
        val subtitleView = TextView(context).apply {
            text = "Access is blocked during your scheduled Curfew Window."
            setTextColor(Color.parseColor("#9c9c9d"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
        }
        val subtitleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(20f)
        }
        card.addView(subtitleView, subtitleParams)

        // 4. Elevated Countdown Box (#101111)
        val timeCard = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            val timeBg = GradientDrawable().apply {
                setColor(Color.parseColor("#101111"))
                cornerRadius = dp(8f).toFloat()
                setStroke(dp(1f), Color.parseColor("#242728"))
            }
            background = timeBg
            setPadding(dp(16f), dp(16f), dp(16f), dp(16f))
        }
        val timeCardParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = dp(24f)
        }

        val countdownLabel = TextView(context).apply {
            text = "TIME REMAINING"
            setTextColor(Color.parseColor("#6a6b6c"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
        }
        val countdownLabelParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(6f)
        }
        timeCard.addView(countdownLabel, countdownLabelParams)

        countdownValueView = TextView(context).apply {
            text = "--:--:--"
            setTextColor(Color.parseColor("#f4f4f6"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 32f)
            typeface = Typeface.MONOSPACE
            letterSpacing = 0.05f
            gravity = Gravity.CENTER
        }
        val countdownValueParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
        }
        timeCard.addView(countdownValueView, countdownValueParams)
        card.addView(timeCard, timeCardParams)

        // 5. White CTA Pill: Exit to Home
        val exitButton = TextView(context).apply {
            text = "Exit to Home"
            setTextColor(Color.BLACK)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val btnBg = GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = dp(8f).toFloat()
            }
            background = btnBg
            isClickable = true
            isFocusable = true
            setOnClickListener {
                onExitHome()
            }
        }
        val exitBtnParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(44f)
        ).apply {
            bottomMargin = dp(16f)
        }
        card.addView(exitButton, exitBtnParams)

        // 6. Escape Hatch Footnote
        val escapeHatchNote = TextView(context).apply {
            text = "Android Settings remains accessible for app removal."
            setTextColor(Color.parseColor("#434345"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            gravity = Gravity.CENTER
        }
        val escapeHatchParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
        }
        card.addView(escapeHatchNote, escapeHatchParams)

        addView(card, cardParams)
    }

    fun setRemainingTime(formatted: String) {
        countdownValueView?.text = formatted
    }

    override fun dispatchKeyEvent(event: KeyEvent?): Boolean {
        if (event?.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
            onExitHome()
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    private fun dp(value: Float): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value,
            resources.displayMetrics
        ).toInt()
    }
}
