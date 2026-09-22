package com.npp.tsd.feature.outgoing

import androidx.compose.foundation.layout.Arrangement
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
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.OutgoingDeliveriesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.component.StatusBadge
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.DocumentStatus
import com.npp.tsd.core.model.OutgoingDelivery
import com.npp.tsd.core.model.OutgoingDeliveryItem

@Composable
fun OutgoingOverviewScreen(
    deliveryId: Int,
    repository: OutgoingDeliveriesRepository,
) {
    val vm: OutgoingDeliveryViewModel = viewModel(
        factory = viewModelFactory { initializer { OutgoingDeliveryViewModel(repository) } },
    )
    LaunchedEffect(deliveryId) { vm.load(deliveryId) }
    val state by vm.state.collectAsState()

    when (val s = state) {
        is UiState.Loading -> FullScreenLoading()
        is UiState.Error -> FullScreenError(message = s.message)
        is UiState.Success -> OutgoingOverviewContent(s.data)
    }
}

@Composable
private fun OutgoingOverviewContent(delivery: OutgoingDelivery) {
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
                    "Кросс-докинг" + (delivery.sourceIncomingDeliveryId?.let { " · создана из ВХП #$it" } ?: ""),
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
        items(delivery.items, key = { it.id }) { item -> OutgoingItemRow(item) }
    }
}

@Composable
private fun OutgoingItemRow(item: OutgoingDeliveryItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            if (item.factQuantity != null) {
                "Заявлено: ${item.quantity} · отгружено: ${item.factQuantity}"
            } else {
                "Заявлено: ${item.quantity}"
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (item.operations.isNotEmpty()) {
            Text(
                item.operations.joinToString(", ") { it.operation.name },
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = Spacing.xs),
            )
        }
        item.totalCost?.let {
            Text(
                "Стоимость: $it ₽",
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = Spacing.xs),
            )
        }
    }
}
