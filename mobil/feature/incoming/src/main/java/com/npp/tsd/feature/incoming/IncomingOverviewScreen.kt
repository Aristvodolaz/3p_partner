package com.npp.tsd.feature.incoming

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.npp.tsd.core.data.IncomingDeliveriesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.component.StatusBadge
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.DocumentStatus
import com.npp.tsd.core.model.IncomingDelivery
import com.npp.tsd.core.model.IncomingDeliveryItem
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory

@Composable
fun IncomingOverviewScreen(
    deliveryId: Int,
    repository: IncomingDeliveriesRepository,
) {
    val vm: IncomingDeliveryViewModel = viewModel(
        factory = viewModelFactory { initializer { IncomingDeliveryViewModel(repository) } },
    )
    LaunchedEffect(deliveryId) { vm.load(deliveryId) }
    val state by vm.state.collectAsState()

    when (val s = state) {
        is UiState.Loading -> FullScreenLoading()
        is UiState.Error -> FullScreenError(message = s.message)
        is UiState.Success -> IncomingOverviewContent(s.data)
    }
}

@Composable
private fun IncomingOverviewContent(delivery: IncomingDelivery) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(Spacing.lg)) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Партнёр: ${delivery.partner.name}", style = MaterialTheme.typography.bodyMedium)
                StatusBadge(delivery.status, DocumentStatus.colorHex(delivery.status))
            }
            delivery.warehouseCode?.let {
                Text("Склад: $it", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = Spacing.xs))
            }
            if (delivery.isCrossDock) {
                Text(
                    "Кросс-докинг — после полной приёмки автоматически создастся ИСП",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.tertiary,
                    modifier = Modifier.padding(top = Spacing.xs),
                )
            }
            delivery.comment?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = Spacing.xs))
            }
            Text(
                "Позиции",
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.sm),
            )
        }
        items(delivery.items, key = { it.id }) { item -> IncomingItemRow(item) }
    }
}

@Composable
private fun IncomingItemRow(item: IncomingDeliveryItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            if (item.factQuantity != null) {
                "Заявлено: ${item.quantity} · принято: ${item.factQuantity}"
            } else {
                "Заявлено: ${item.quantity}"
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
