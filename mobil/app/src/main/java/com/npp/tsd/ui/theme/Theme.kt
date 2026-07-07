package com.npp.tsd.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val PrimaryBlue = Color(0xFF1B4F8A)
val PrimaryBlueDark = Color(0xFF163F6E)
val SurfaceLight = Color(0xFFF9FAFB)
val Green = Color(0xFF16A34A)
val Red = Color(0xFFDC2626)
val Amber = Color(0xFFD97706)

private val LightColors = lightColorScheme(
    primary = PrimaryBlue,
    onPrimary = Color.White,
    secondary = PrimaryBlueDark,
    background = SurfaceLight,
    surface = Color.White,
    error = Red,
)

private val DarkColors = darkColorScheme(
    primary = PrimaryBlue,
    onPrimary = Color.White,
)

@Composable
fun TsdTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
