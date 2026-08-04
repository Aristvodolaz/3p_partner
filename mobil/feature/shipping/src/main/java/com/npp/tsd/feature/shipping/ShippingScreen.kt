package com.npp.tsd.feature.shipping

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
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.Shipment
import com.npp.tsd.core.model.ShipmentItemBody
import com.npp.tsd.core.model.ShipmentMethod

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShippingScreen(
    requestId: Int,
    requestsRepository: RequestsRepository,
    warehouseRepository: WarehouseRepository,
    employeeName: String,
) {
    val vm: ShippingViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ShippingViewModel(requestsRepository, warehouseRepository) }
        },
    )
    LaunchedEffect(requestId) { vm.load(requestId) }
    val state by vm.state.collectAsState()
    val shipments by vm.shipments.collectAsState()
    val saving by vm.saving.collectAsState()
    val actionError by vm.actionError.collectAsState()

    val snackbarHost = remember { SnackbarHostState() }
    LaunchedEffect(actionError) {
        actionError?.let {
            snackbarHost.showSnackbar(it)
            vm.clearError()
        }
    }

    var shipDialogTarget by remember { mutableStateOf<Shipment?>(null) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHost) },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))

            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))

            is UiState.Success -> {
                val request = s.data
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(Spacing.lg),
                ) {
                    item {
                        NewShipmentForm(
                            items = request.items.map { it.article to (it.name ?: it.article) to it.quantity },
                            saving = saving,
                            onSubmit = { method, vehicle, driver, items -> vm.submitShipment(method, vehicle, driver, items) },
                        )
                    }
                    item {
                        Text(
                            "История отгрузок",
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(top = Spacing.xl, bottom = Spacing.sm),
                        )
                    }
                    if (shipments.isEmpty()) {
                        item { EmptyState(message = "Отгрузок пока не было", icon = Icons.Filled.LocalShipping) }
                    } else {
                        items(shipments, key = { it.id }) { shipment ->
                            ShipmentCard(
                                shipment = shipment,
                                onMarkShipped = { shipDialogTarget = shipment },
                                onGenerateDocument = { type -> vm.generateDocument(shipment.id, type) },
                            )
                        }
                    }
                }
            }
        }
    }

    shipDialogTarget?.let { shipment ->
        MarkShippedDialog(
            saving = saving,
            employeeName = employeeName,
            onDismiss = { shipDialogTarget = null },
            onConfirm = {
                vm.markShipped(shipment.id, employeeName)
                shipDialogTarget = null
            },
        )
    }
}

@Composable
private fun NewShipmentForm(
    items: List<Pair<Pair<String, String>, Int>>,
    saving: Boolean,
    onSubmit: (method: String, vehicleInfo: String?, driverName: String?, items: List<ShipmentItemBody>) -> Unit,
) {
    var method by remember { mutableStateOf(ShipmentMethod.SELF) }
    var vehicleInfo by remember { mutableStateOf("") }
    var driverName by remember { mutableStateOf("") }
    val quantities = remember(items) {
        items.map { (info, qty) -> Triple(info.first, info.second, qty.toString()) }.toMutableStateList()
    }

    Column {
        Text("Новая отгрузка", style = MaterialTheme.typography.titleMedium)

        Row(Modifier.fillMaxWidth().padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            ShipmentMethod.ALL.forEach { m ->
                FilterChip(
                    selected = method == m,
                    onClick = { method = m },
                    label = { Text(ShipmentMethod.label(m)) },
                )
            }
        }

        if (method == ShipmentMethod.SELF) {
            OutlinedTextField(
                value = vehicleInfo,
                onValueChange = { vehicleInfo = it },
                label = { Text("Автомобиль (гос. номер)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
            )
            OutlinedTextField(
                value = driverName,
                onValueChange = { driverName = it },
                label = { Text("Водитель") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
            )
        }

        Text("Позиции", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = Spacing.md))
        quantities.forEachIndexed { index, (article, name, qty) ->
            Row(
                Modifier.fillMaxWidth().padding(top = Spacing.xs),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("$article — $name", modifier = Modifier.weight(1f))
                OutlinedTextField(
                    value = qty,
                    onValueChange = { quantities[index] = Triple(article, name, it.filter(Char::isDigit)) },
                    singleLine = true,
                    modifier = Modifier.width(90.dp),
                )
            }
        }

        Button(
            enabled = !saving,
            onClick = {
                val bodies = quantities.mapNotNull { (article, name, qty) ->
                    val n = qty.toIntOrNull() ?: return@mapNotNull null
                    if (n <= 0) null else ShipmentItemBody(article, name, n)
                }
                onSubmit(method, vehicleInfo.ifBlank { null }, driverName.ifBlank { null }, bodies)
            },
            modifier = Modifier.padding(top = Spacing.sm),
        ) {
            Text(if (saving) "Сохранение..." else "Создать отгрузку")
        }
    }
}

@Composable
private fun ShipmentCard(
    shipment: Shipment,
    onMarkShipped: () -> Unit,
    onGenerateDocument: (String) -> Unit,
) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(ShipmentMethod.label(shipment.method), fontWeight = FontWeight.SemiBold)
            Text(if (shipment.shippedAt != null) "Отгружено" else "Не отгружено")
        }
        shipment.vehicleInfo?.let { Text("Авто: $it", style = MaterialTheme.typography.bodySmall) }
        shipment.driverName?.let { Text("Водитель: $it", style = MaterialTheme.typography.bodySmall) }
        shipment.items.forEach {
            Text("${it.article}: ${it.quantity} шт.", style = MaterialTheme.typography.bodySmall)
        }
        Row(Modifier.padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            if (shipment.shippedAt == null) {
                Button(onClick = onMarkShipped) { Text("Отметить отгруженной") }
            } else {
                OutlinedButton(onClick = { onGenerateDocument("TTN") }) { Text("ТТН") }
                OutlinedButton(onClick = { onGenerateDocument("MX3") }) { Text("МХ-3") }
            }
        }
    }
}

@Composable
private fun MarkShippedDialog(
    saving: Boolean,
    employeeName: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Отметить отгруженной") },
        text = { Text("Отгрузил: $employeeName") },
        confirmButton = {
            TextButton(enabled = !saving, onClick = onConfirm) {
                Text("Подтвердить")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}
