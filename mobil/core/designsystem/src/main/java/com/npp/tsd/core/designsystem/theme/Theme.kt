package com.npp.tsd.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Blue40,
    onPrimary = Neutral99,
    primaryContainer = Blue90,
    onPrimaryContainer = Blue10,
    secondary = Teal40,
    onSecondary = Neutral99,
    background = Neutral99,
    onBackground = Neutral10,
    surface = Neutral99,
    onSurface = Neutral10,
    surfaceVariant = Neutral95,
    onSurfaceVariant = Neutral30,
    outline = Neutral50,
    outlineVariant = Neutral90,
    error = Red40,
    onError = Neutral99,
    errorContainer = Red90,
    onErrorContainer = Red40,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8FB6E8),
    onPrimary = Blue10,
    primaryContainer = Blue30,
    onPrimaryContainer = Blue90,
    secondary = Teal40,
    onSecondary = NeutralDark10,
    background = NeutralDark10,
    onBackground = Neutral95,
    surface = NeutralDark20,
    onSurface = Neutral95,
    surfaceVariant = NeutralDark30,
    onSurfaceVariant = Neutral90,
    outline = Neutral50,
    outlineVariant = NeutralDark30,
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Red90,
)

@Composable
fun TsdTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = TsdTypography,
        shapes = TsdShapes,
        content = content,
    )
}
