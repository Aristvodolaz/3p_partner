package com.npp.tsd.feature.incoming

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.setValue
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.compose.material3.FilterChip
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import com.npp.tsd.core.data.IncomingDeliveriesRepository
import com.npp.tsd.core.data.WarehouseZonesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.IncomingDelivery
import com.npp.tsd.core.model.IncomingDeliveryItem
import com.npp.tsd.core.model.ReceiveIncomingDeliveryItemBody
import com.npp.tsd.core.model.ZoneType

@Composable
fun IncomingReceivingScreen(
    deliveryId: Int,
    repository: IncomingDeliveriesRepository,
    zonesRepository: WarehouseZonesRepository,
    employeeName: String,
) {
    val vm: IncomingDeliveryViewModel = viewModel(
        factory = viewModelFactory { initializer { IncomingDeliveryViewModel(repository) } },
    )
    LaunchedEffect(deliveryId) { vm.load(deliveryId) }
    val state by vm.state.collectAsState()
    val saving by vm.saving.collectAsState()
    val actionError by vm.actionError.collectAsState()

    // Адреса зоны приёмки — подсказка для поля "Адрес": вводится сканером
    // (работает как клавиатура) или вручную, без камеры (см. core:designsystem).
    var receivingAddresses by remember { mutableStateOf<List<String>>(emptyList()) }
    LaunchedEffect(Unit) {
        runCatching { zonesRepository.getAddresses(zoneType = ZoneType.RECEIVING) }
            .onSuccess { receivingAddresses = it.map { a -> a.code } }
    }

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
            is UiState.Success -> ReceivingForm(
                delivery = s.data,
                saving = saving,
                employeeName = employeeName,
                receivingAddresses = receivingAddresses,
                onSubmit = { items -> vm.submitReceipt(items) },
                modifier = Modifier.padding(padding),
            )
        }
    }
}

private data class ReceivingRow(
    val itemId: Int,
    val article: String,
    val name: String,
    val quantity: Int,
    var factQty: String,
    var addressCode: String,
)

@Composable
private fun ReceivingForm(
    delivery: IncomingDelivery,
    saving: Boolean,
    employeeName: String,
    receivingAddresses: List<String>,
    onSubmit: (List<ReceiveIncomingDeliveryItemBody>) -> Unit,
    modifier: Modifier = Modifier,
) {
    val pending = delivery.items.filter { it.factQuantity == null }
    val received = delivery.items.filter { it.factQuantity != null }

    val rows = remember(pending) {
        pending.map {
            ReceivingRow(it.id, it.article, it.name ?: it.article, it.quantity, it.quantity.toString(), "")
        }.toMutableStateList()
    }

    LazyColumn(modifier = modifier.fillMaxSize(), contentPadding = PaddingValues(Spacing.lg)) {
        item {
            Text("Принял: $employeeName", style = MaterialTheme.typography.bodyMedium)

            if (received.isNotEmpty()) {
                Text(
                    "Уже принято",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.md, bottom = Spacing.xs),
                )
                received.forEach { ReceivedRow(it) }
            }

            if (pending.isEmpty()) {
                EmptyState(message = "Все позиции уже приняты", icon = Icons.Filled.CheckCircle)
            } else {
                Text(
                    "К приёмке",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.xs),
                )
                Text(
                    "Укажите адрес зоны приёмки, куда фактически размещаете товар — " +
                        "дальше переместите его в хранение через «Склад».",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        if (pending.isNotEmpty()) {
            items(rows.size) { idx -> PendingRow(rows[idx], receivingAddresses) }
            item {
                Button(
                    enabled = !saving,
                    onClick = {
                        val bodies = rows.mapNotNull {
                            val qty = it.factQty.toIntOrNull() ?: return@mapNotNull null
                            ReceiveIncomingDeliveryItemBody(
                                itemId = it.itemId,
                                factQuantity = qty,
                                addressCode = it.addressCode.trim().ifBlank { null },
                            )
                        }
                        onSubmit(bodies)
                    },
                    modifier = Modifier.padding(top = Spacing.md),
                ) {
                    Text(if (saving) "Сохранение..." else "Подтвердить приёмку")
                }
            }
        }
    }
}

@Composable
private fun ReceivedRow(item: IncomingDeliveryItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "Принято ${item.factQuantity} из ${item.quantity}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun PendingRow(row: ReceivingRow, receivingAddresses: List<String>) {
    var factQty by remember { mutableStateOf(row.factQty) }
    var addressCode by remember { mutableStateOf(row.addressCode) }
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
                modifier = Modifier.width(120.dp),
            )
            OutlinedTextField(
                value = addressCode,
                onValueChange = {
                    addressCode = it
                    row.addressCode = it
                },
                label = { Text("Адрес приёмки") },
                singleLine = true,
                modifier = Modifier.width(160.dp),
            )
        }
        if (receivingAddresses.isNotEmpty()) {
            Row(
                Modifier.fillMaxWidth().padding(top = Spacing.xs).horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                receivingAddresses.forEach { code ->
                    FilterChip(
                        selected = addressCode == code,
                        onClick = {
                            addressCode = code
                            row.addressCode = code
                        },
                        label = { Text(code) },
                    )
                }
            }
        }
    }
}
