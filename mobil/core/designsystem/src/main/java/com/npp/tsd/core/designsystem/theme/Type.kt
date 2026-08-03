package com.npp.tsd.core.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * Акцентная гарнитура для заголовков — системный serif (эхо web-пары
 * Fraunces/IBM Plex Sans без риска загрузки шрифтов на офлайн ТСД-сканерах:
 * `FontFamily.Serif` всегда встроен в Android, не требует сети/Google Play
 * Services Font Provider). Используется точечно — заголовок экрана заявки,
 * приветствие на логине, крупные KPI-цифры.
 */
val DisplayFontFamily = FontFamily.Serif

val TsdTypography = Typography().let { base ->
    base.copy(
        headlineSmall = base.headlineSmall.copy(
            fontFamily = DisplayFontFamily,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = (-0.2).sp,
        ),
        titleLarge = base.titleLarge.copy(
            fontFamily = DisplayFontFamily,
            fontWeight = FontWeight.SemiBold,
            fontSize = 21.sp,
            letterSpacing = (-0.1).sp,
        ),
        titleMedium = base.titleMedium.copy(fontWeight = FontWeight.SemiBold),
        titleSmall = base.titleSmall.copy(fontWeight = FontWeight.Medium),
        labelLarge = base.labelLarge.copy(fontWeight = FontWeight.Medium),
        labelSmall = base.labelSmall.copy(fontWeight = FontWeight.Medium, letterSpacing = 0.2.sp),
    )
}

/** Крупная цифра для счётчиков и KPI-плашек — цифры в столбик (табличные). */
val StatNumberStyle = TextStyle(
    fontFamily = DisplayFontFamily,
    fontSize = 24.sp,
    fontWeight = FontWeight.SemiBold,
    fontFeatureSettings = "tnum",
)
