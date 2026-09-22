package com.npp.tsd.feature.outgoing

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.OutgoingDeliveriesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.OutgoingDelivery
import com.npp.tsd.core.model.OutgoingDeliveryItem
import com.npp.tsd.core.model.ShipOutgoingDeliveryItemBody

@Composable
fun OutgoingShippingScreen(
    deliveryId: Int,
    repository: OutgoingDeliveriesRepository,
    employeeName: String,
) {
    val vm: OutgoingDeliveryViewModel = viewModel(
        factory = viewModelFactory { initializer { OutgoingDeliveryViewModel(repository) } },
    )
    LaunchedEffect(deliveryId) { vm.load(deliveryId) }
    val state by vm.state.collectAsState()
    val saving by vm.saving.collectAsState()
    val actionError by vm.actionError.collectAsState()

    val snackbarHost = remember { SnackbarHostState() }
    LaunchedEffect(actionError) {
        actionError?.let {
            snackbarHost.showSnackbar(it)
            vm.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHost) },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))
            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))
            is UiState.Success -> ShippingForm(
                delivery = s.data,
                saving = saving,
                employeeName = employeeName,
                onSubmit = { items -> vm.submitShipment(items) },
                modifier = Modifier.padding(padding),
            )
        }
    }
}

private data class ShippingRow(
    val itemId: Int,
    val article: String,
    val name: String,
    val quantity: Int,
    var factQty: String,
)

@Composable
private fun ShippingForm(
    delivery: OutgoingDelivery,
    saving: Boolean,
    employeeName: String,
    onSubmit: (List<ShipOutgoingDeliveryItemBody>) -> Unit,
    modifier: Modifier = Modifier,
) {
    val pending = delivery.items.filter { it.factQuantity == null }
    val shipped = delivery.items.filter { it.factQuantity != null }

    val rows = remember(pending) {
        pending.map {
            ShippingRow(it.id, it.article, it.name ?: it.article, it.quantity, it.quantity.toString())
        }.toMutableStateList()
    }

    LazyColumn(modifier = modifier.fillMaxSize(), contentPadding = PaddingValues(Spacing.lg)) {
        item {
            Text("Отгрузил: $employeeName", style = MaterialTheme.typography.bodyMedium)

            if (shipped.isNotEmpty()) {
                Text(
                    "Уже отгружено",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.md, bottom = Spacing.xs),
                )
                shipped.forEach { ShippedRow(it) }
            }

            if (pending.isEmpty()) {
                EmptyState(message = "Все позиции уже отгружены", icon = Icons.Filled.CheckCircle)
            } else {
                Text(
                    "К отгрузке",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.xs),
                )
            }
        }

        if (pending.isNotEmpty()) {
            items(rows.size) { idx -> PendingRow(rows[idx]) }
            item {
                Button(
                    enabled = !saving,
                    onClick = {
                        val bodies = rows.mapNotNull {
                            val qty = it.factQty.toIntOrNull() ?: return@mapNotNull null
                            ShipOutgoingDeliveryItemBody(it.itemId, qty)
                        }
                        onSubmit(bodies)
                    },
                    modifier = Modifier.padding(top = Spacing.md),
                ) {
                    Text(if (saving) "Сохранение..." else "Подтвердить отгрузку")
                }
            }
        }
    }
}

@Composable
private fun ShippedRow(item: OutgoingDeliveryItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "Отгружено ${item.factQuantity} из ${item.quantity}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun PendingRow(row: ShippingRow) {
    var factQty by remember { mutableStateOf(row.factQty) }
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${row.article} — ${row.name}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "Заявлено: ${row.quantity}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(
            Modifier.fillMaxWidth().padding(top = Spacing.xs),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            OutlinedTextField(
                value = factQty,
                onValueChange = { input ->
                    val digits = input.filter(Char::isDigit)
                    factQty = digits
                    row.factQty = digits
                },
                label = { Text("Факт") },
                singleLine = true,
                modifier = Modifier.width(160.dp),
            )
        }
    }
}
