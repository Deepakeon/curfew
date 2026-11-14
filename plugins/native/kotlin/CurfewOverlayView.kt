package com.curfew

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.graphics.drawable.StateListDrawable
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Native Android View for Curfew Overlay.
 * Designed to strictly mirror the Raycast Dark-Canvas Design System (DESIGN.md and src/theme.ts).
 *
 * Elevation hierarchy:
 *   Canvas (#07080a) -> Surface (#0d0d0d) -> Surface Elevated (#101111) / Surface Card (#121212) -> Primary CTA (#ffffff)
 */
class CurfewOverlayView(
    context: Context,
    private val onExitHome: () -> Unit
) : FrameLayout(context) {

    // Theme tokens derived directly from DESIGN.md and src/theme.ts
    private object Tokens {
        const val CANVAS = "#07080a"
        const val SURFACE = "#0d0d0d"
        const val SURFACE_ELEVATED = "#101111"
        const val SURFACE_CARD = "#121212"
        const val HAIRLINE = "#242728"
        const val HAIRLINE_STRONG = "#29ffffff" // rgba(255, 255, 255, 0.16)
        const val INK = "#f4f4f6"
        const val BODY = "#cdcdcd"
        const val MUTE = "#9c9c9d"
        const val ASH = "#6a6b6c"
        const val STONE = "#434345"
        const val ACCENT_RED = "#ff6161"
        const val ACCENT_RED_SOFT = "#26ff6161" // rgba(255, 97, 97, 0.15)
        const val PRIMARY = "#ffffff"
        const val PRIMARY_PRESSED = "#e8e8e8"
        const val ON_PRIMARY = "#000000"

        const val RADIUS_XS = 4f
        const val RADIUS_SM = 6f
        const val RADIUS_MD = 8f
        const val RADIUS_LG = 10f
        const val RADIUS_XL = 16f
        const val RADIUS_FULL = 9999f

        const val SPACING_XS = 4f
        const val SPACING_SM = 8f
        const val SPACING_MD = 12f
        const val SPACING_LG = 16f
        const val SPACING_XL = 24f
    }

    private var countdownValueView: TextView? = null
    private var hoursValueView: TextView? = null
    private var minutesValueView: TextView? = null
    private var secondsValueView: TextView? = null

    init {
        // Dark-canvas root container (#07080a) consuming all touch events
        setBackgroundColor(Color.parseColor(Tokens.CANVAS))
        isClickable = true
        isFocusable = true
        isFocusableInTouchMode = true
        setOnTouchListener { _, _ -> true }

        // Modal Card: max 400dp width (clamped for tablet/wide screens), 16dp radius, 1px hairline border, surface bg
        val card = object : LinearLayout(context) {
            override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
                val maxAllowedWidth = dp(400f)
                val widthSize = MeasureSpec.getSize(widthMeasureSpec)
                val widthMode = MeasureSpec.getMode(widthMeasureSpec)
                val constrainedWidth = if (widthSize > maxAllowedWidth) {
                    MeasureSpec.makeMeasureSpec(maxAllowedWidth, widthMode)
                } else {
                    widthMeasureSpec
                }
                super.onMeasure(constrainedWidth, heightMeasureSpec)
            }
        }.apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor(Tokens.SURFACE))
                cornerRadius = dp(Tokens.RADIUS_XL).toFloat()
                setStroke(dp(1f), Color.parseColor(Tokens.HAIRLINE))
            }
            background = bg
            setPadding(
                dp(Tokens.SPACING_XL),
                dp(Tokens.SPACING_XL),
                dp(Tokens.SPACING_XL),
                dp(Tokens.SPACING_XL)
            )
            isClickable = true
        }

        val cardParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER
            leftMargin = dp(Tokens.SPACING_LG)
            rightMargin = dp(Tokens.SPACING_LG)
        }

        // 1. Sleek Lock Icon Tile: 44dp x 44dp, rounded.lg (10dp), surfaceElevated, hairline border
        val iconTile = FrameLayout(context).apply {
            val tileBg = GradientDrawable().apply {
                setColor(Color.parseColor(Tokens.SURFACE_ELEVATED))
                cornerRadius = dp(Tokens.RADIUS_LG).toFloat()
                setStroke(dp(1f), Color.parseColor(Tokens.HAIRLINE))
            }
            background = tileBg
        }
        val iconView = LockIconView(context)
        val iconInnerParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        iconTile.addView(iconView, iconInnerParams)

        val iconTileParams = LinearLayout.LayoutParams(dp(44f), dp(44f)).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(Tokens.SPACING_MD)
        }
        card.addView(iconTile, iconTileParams)

        // 2. Status Badge: Pill matching App.tsx headerStatusBadgeActive (accentRedSoft bg, accentRed border, red dot)
        val statusBadge = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val badgeBg = GradientDrawable().apply {
                setColor(Color.parseColor(Tokens.ACCENT_RED_SOFT))
                cornerRadius = dp(Tokens.RADIUS_FULL).toFloat()
                setStroke(dp(1f), Color.parseColor(Tokens.ACCENT_RED))
            }
            background = badgeBg
            setPadding(dp(Tokens.SPACING_SM), dp(3f), dp(Tokens.SPACING_SM), dp(3f))
        }

        val statusDot = View(context).apply {
            val dotBg = GradientDrawable().apply {
                setColor(Color.parseColor(Tokens.ACCENT_RED))
                shape = GradientDrawable.OVAL
            }
            background = dotBg
        }
        val dotParams = LinearLayout.LayoutParams(dp(6f), dp(6f)).apply {
            rightMargin = dp(5f)
        }
        statusBadge.addView(statusDot, dotParams)

        val statusText = TextView(context).apply {
            text = "CURFEW ACTIVE"
            setTextColor(Color.parseColor(Tokens.ACCENT_RED))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
        }
        statusBadge.addView(statusText)

        val statusBadgeParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(Tokens.SPACING_MD)
        }
        card.addView(statusBadge, statusBadgeParams)

        // 3. Title: "App Restricted" (headingLg: 22sp, bold, ink #f4f4f6)
        val titleView = TextView(context).apply {
            text = "App Restricted"
            setTextColor(Color.parseColor(Tokens.INK))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        val titleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(Tokens.SPACING_XS)
        }
        card.addView(titleView, titleParams)

        // 4. Subtitle: Clear & Empathetic Context (bodySm: 13sp, mute #9c9c9d)
        val subtitleView = TextView(context).apply {
            text = "Access is blocked during your scheduled window."
            setTextColor(Color.parseColor(Tokens.MUTE))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            gravity = Gravity.CENTER
            setLineSpacing(dp(2f).toFloat(), 1.2f)
        }
        val subtitleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(Tokens.SPACING_LG)
        }
        card.addView(subtitleView, subtitleParams)

        // 5. Timer Card: surfaceCard (#121212) container with 3 segmented keycap digit tiles
        val timerCard = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            val timerBg = GradientDrawable().apply {
                setColor(Color.parseColor(Tokens.SURFACE_CARD))
                cornerRadius = dp(Tokens.RADIUS_LG).toFloat()
                setStroke(dp(1f), Color.parseColor(Tokens.HAIRLINE))
            }
            background = timerBg
            setPadding(
                dp(Tokens.SPACING_LG),
                dp(Tokens.SPACING_MD),
                dp(Tokens.SPACING_LG),
                dp(Tokens.SPACING_LG)
            )
        }
        val timerCardParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = dp(Tokens.SPACING_LG)
        }

        val timerHeader = TextView(context).apply {
            text = "TIME UNTIL UNLOCK"
            setTextColor(Color.parseColor(Tokens.MUTE))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            gravity = Gravity.CENTER
        }
        val timerHeaderParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(Tokens.SPACING_MD)
        }
        timerCard.addView(timerHeader, timerHeaderParams)

        // Digits row with 3 keycap tiles: [HH] : [MM] : [SS]
        val digitsRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }

        fun createKeycapTile(initialValue: String, label: String): Pair<LinearLayout, TextView> {
            val tile = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                val bg = GradientDrawable().apply {
                    setColor(Color.parseColor(Tokens.SURFACE_ELEVATED))
                    cornerRadius = dp(Tokens.RADIUS_MD).toFloat()
                    setStroke(dp(1f), Color.parseColor(Tokens.HAIRLINE))
                }
                background = bg
                setPadding(dp(4f), dp(8f), dp(4f), dp(6f))
            }

            val valView = TextView(context).apply {
                text = initialValue
                setTextColor(Color.parseColor(Tokens.INK))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 24f)
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
            tile.addView(
                valView,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            )

            val lblView = TextView(context).apply {
                text = label
                setTextColor(Color.parseColor(Tokens.MUTE))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
                typeface = Typeface.DEFAULT_BOLD
                letterSpacing = 0.08f
                gravity = Gravity.CENTER
            }
            val lblParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp(2f)
            }
            tile.addView(lblView, lblParams)

            return Pair(tile, valView)
        }

        fun createSeparator(): TextView {
            return TextView(context).apply {
                text = ":"
                setTextColor(Color.parseColor(Tokens.ASH))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
        }

        val (hoursTile, hView) = createKeycapTile("--", "HOURS")
        hoursValueView = hView

        val (minutesTile, mView) = createKeycapTile("--", "MINUTES")
        minutesValueView = mView

        val (secondsTile, sView) = createKeycapTile("--", "SECONDS")
        secondsValueView = sView

        val tileParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        val sep1Params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            leftMargin = dp(6f)
            rightMargin = dp(6f)
            bottomMargin = dp(10f)
            gravity = Gravity.CENTER_VERTICAL
        }
        val sep2Params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            leftMargin = dp(6f)
            rightMargin = dp(6f)
            bottomMargin = dp(10f)
            gravity = Gravity.CENTER_VERTICAL
        }

        digitsRow.addView(hoursTile, tileParams)
        digitsRow.addView(createSeparator(), sep1Params)
        digitsRow.addView(minutesTile, tileParams)
        digitsRow.addView(createSeparator(), sep2Params)
        digitsRow.addView(secondsTile, tileParams)

        timerCard.addView(
            digitsRow,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        // Hidden / fallback countdown value view for backward compatibility
        countdownValueView = TextView(context).apply {
            visibility = View.GONE
        }
        timerCard.addView(countdownValueView)

        card.addView(timerCard, timerCardParams)

        // 6. Tactile White CTA Pill: Exit to Home (button-primary: rounded.md 8dp, white bg, black text)
        val exitButton = TextView(context).apply {
            text = "Exit to Home"
            setTextColor(Color.parseColor(Tokens.ON_PRIMARY))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER

            val normalBg = GradientDrawable().apply {
                setColor(Color.parseColor(Tokens.PRIMARY))
                cornerRadius = dp(Tokens.RADIUS_MD).toFloat()
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                background = RippleDrawable(
                    ColorStateList.valueOf(Color.parseColor("#33000000")),
                    normalBg,
                    normalBg
                )
            } else {
                val pressedBg = GradientDrawable().apply {
                    setColor(Color.parseColor(Tokens.PRIMARY_PRESSED))
                    cornerRadius = dp(Tokens.RADIUS_MD).toFloat()
                }
                val states = StateListDrawable().apply {
                    addState(intArrayOf(android.R.attr.state_pressed), pressedBg)
                    addState(intArrayOf(), normalBg)
                }
                background = states
            }

            isClickable = true
            isFocusable = true
            setOnClickListener {
                onExitHome()
            }
        }
        val exitBtnParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(42f)
        ).apply {
            bottomMargin = dp(Tokens.SPACING_MD)
        }
        card.addView(exitButton, exitBtnParams)

        // 7. Escape Hatch Footnote: Mute color (#9c9c9d), captionSm (12sp)
        // val escapeHatchNote = TextView(context).apply {
        //     text = "Android Settings remains accessible"
        //     setTextColor(Color.parseColor(Tokens.MUTE))
        //     setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        //     gravity = Gravity.CENTER
        // }
        // val escapeHatchParams = LinearLayout.LayoutParams(
        //     LinearLayout.LayoutParams.WRAP_CONTENT,
        //     LinearLayout.LayoutParams.WRAP_CONTENT
        // ).apply {
        //     gravity = Gravity.CENTER_HORIZONTAL
        // }
        // card.addView(escapeHatchNote, escapeHatchParams)

        addView(card, cardParams)
    }

    fun setRemainingTime(formatted: String) {
        countdownValueView?.text = formatted
        val parts = formatted.split(":")
        if (parts.size == 3) {
            hoursValueView?.text = parts[0]
            minutesValueView?.text = parts[1]
            secondsValueView?.text = parts[2]
        }
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

    /**
     * Vector lock icon rendered cleanly on native canvas without external assets.
     */
    private class LockIconView(context: Context) : View(context) {
        private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor(Tokens.INK)
            style = Paint.Style.STROKE
            strokeWidth = dp(2f).toFloat()
            strokeCap = Paint.Cap.ROUND
        }
        private val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor(Tokens.INK)
            style = Paint.Style.FILL
        }
        private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor(Tokens.SURFACE_ELEVATED)
            style = Paint.Style.FILL
        }

        private fun dp(value: Float): Int {
            return TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                resources.displayMetrics
            ).toInt()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val cx = width / 2f
            val cy = height / 2f

            val bodyW = dp(16f).toFloat()
            val bodyH = dp(12f).toFloat()
            val bodyTop = cy - dp(1f)
            val bodyLeft = cx - bodyW / 2f
            val bodyRight = cx + bodyW / 2f
            val bodyBottom = bodyTop + bodyH
            val corner = dp(Tokens.RADIUS_XS).toFloat()

            // Lock Shackle (Inverted U shape)
            val shackleW = dp(10f).toFloat()
            val shackleH = dp(9f).toFloat()
            val shackleTop = bodyTop - shackleH + dp(1f)
            val shackleLeft = cx - shackleW / 2f
            val shackleRight = cx + shackleW / 2f

            val shackleRect = RectF(shackleLeft, shackleTop, shackleRight, shackleTop + shackleH * 2)
            val path = Path().apply {
                moveTo(shackleLeft, bodyTop + dp(1f))
                lineTo(shackleLeft, shackleTop + shackleH)
                arcTo(shackleRect, 180f, 180f, false)
                lineTo(shackleRight, bodyTop + dp(1f))
            }
            canvas.drawPath(path, strokePaint)

            // Lock Body
            val bodyRect = RectF(bodyLeft, bodyTop, bodyRight, bodyBottom)
            canvas.drawRoundRect(bodyRect, corner, corner, bodyPaint)

            // Keyhole dot
            canvas.drawCircle(cx, bodyTop + bodyH * 0.45f, dp(1.5f).toFloat(), dotPaint)
        }
    }
}
