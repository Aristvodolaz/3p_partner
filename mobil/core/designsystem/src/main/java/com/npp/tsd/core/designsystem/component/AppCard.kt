package com.npp.tsd.core.designsystem.component

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.unit.dp

/**
 * Единый стиль карточки-строки списка во всём приложении: плоская светлая
 * поверхность с тонкой обводкой вместо elevation-теней.
 *
 * Material3 [Card] при любой ненулевой elevation подмешивает [surfaceTint]
 * в цвет контейнера (surfaceColorAtElevation) — из-за этого светлая
 * поверхность "утяжеляется" к акцентному оттенку и на глаз выходит темнее
 * фона экрана, а не светлее. Поэтому здесь elevation = 0, а видимость
 * карточки на фоне обеспечивает just contrast surface/background + обводка.
 */
@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(14.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = MaterialTheme.shapes.medium
    val colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    val elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    val border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)

    if (onClick != null) {
        val interactionSource = remember { MutableInteractionSource() }
        val pressed by interactionSource.collectIsPressedAsState()
        val scaleValue by animateFloatAsState(
            targetValue = if (pressed) 0.98f else 1f,
            animationSpec = tween(120),
            label = "cardPressScale",
        )
        Card(
            modifier = modifier.scale(scaleValue),
            shape = shape,
            colors = colors,
            elevation = elevation,
            border = border,
            interactionSource = interactionSource,
            onClick = onClick,
        ) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    } else {
        Card(modifier = modifier, shape = shape, colors = colors, elevation = elevation, border = border) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    }
}
