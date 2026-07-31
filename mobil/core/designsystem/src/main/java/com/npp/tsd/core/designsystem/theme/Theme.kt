package com.npp.tsd.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// Полностью заданная схема — если оставить часть ролей (secondaryContainer,
// tertiary и т.д.) по умолчанию, Compose Material3 подставляет свой лиловый
// baseline, и он "просачивается" в NavigationBar/FilterChip/AssistChip,
// которые используют эти роли для состояния "выбрано". Поэтому здесь заданы
// все ключевые роли на основе фирменного синего, чтобы выбранные элементы
// везде были синими, а не случайно-фиолетовыми.
private val LightColors = lightColorScheme(
    primary = Blue40,
    onPrimary = Neutral99,
    primaryContainer = Blue90,
    onPrimaryContainer = Blue10,
    inversePrimary = Blue80,

    secondary = Blue40,
    onSecondary = Neutral99,
    secondaryContainer = Blue90,
    onSecondaryContainer = Blue10,

    tertiary = Teal40,
    onTertiary = Neutral99,
    tertiaryContainer = Teal90,
    onTertiaryContainer = Teal10,

    background = Neutral95,
    onBackground = Neutral10,
    surface = Neutral99,
    onSurface = Neutral10,
    surfaceVariant = Neutral90,
    onSurfaceVariant = Neutral30,
    surfaceTint = Blue40,

    inverseSurface = Neutral20,
    inverseOnSurface = Neutral95,

    outline = Neutral50,
    outlineVariant = Neutral90,

    error = Red40,
    onError = Neutral99,
    errorContainer = Red90,
    onErrorContainer = Red10,
    scrim = Neutral10,
)

private val DarkColors = darkColorScheme(
    primary = Blue80,
    onPrimary = Blue10,
    primaryContainer = Blue30,
    onPrimaryContainer = Blue90,
    inversePrimary = Blue40,

    secondary = Blue80,
    onSecondary = Blue10,
    secondaryContainer = Blue30,
    onSecondaryContainer = Blue90,

    tertiary = Teal80,
    onTertiary = Teal10,
    tertiaryContainer = Teal30,
    onTertiaryContainer = Teal90,

    background = NeutralDark10,
    onBackground = Neutral95,
    surface = NeutralDark20,
    onSurface = Neutral95,
    surfaceVariant = NeutralDark30,
    onSurfaceVariant = Neutral90,
    surfaceTint = Blue80,

    inverseSurface = Neutral95,
    inverseOnSurface = NeutralDark20,

    outline = Neutral50,
    outlineVariant = NeutralDark30,

    error = Red80,
    onError = Red20,
    errorContainer = Red30,
    onErrorContainer = Red90,
    scrim = NeutralDark10,
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
