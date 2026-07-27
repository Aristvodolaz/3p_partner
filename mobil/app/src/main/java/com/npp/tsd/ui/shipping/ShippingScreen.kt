package com.npp.tsd.ui.shipping

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import com.npp.tsd.data.model.Shipment
import com.npp.tsd.data.model.ShipmentItemBody
import com.npp.tsd.data.model.ShipmentMethod
import com.npp.tsd.ui.common.UiState
import com.npp.tsd.ui.common.ViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShippingScreen(requestId: Int, factory: ViewModelFactory, onBack: () -> Unit) {
    val vm: ShippingViewModel = viewModel(factory = factory)
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
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Отгрузка") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHost) },
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }

            is UiState.Error -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(s.message)
            }

            is UiState.Success -> {
                val request = s.data
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
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
                            modifier = Modifier.padding(top = 20.dp, bottom = 8.dp),
                        )
                    }
                    if (shipments.isEmpty()) {
                        item { Text("Отгрузок пока не было", color = MaterialTheme.colorScheme.onSurfaceVariant) }
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
            onDismiss = { shipDialogTarget = null },
            onConfirm = { shippedBy ->
                vm.markShipped(shipment.id, shippedBy)
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

        Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            )
            OutlinedTextField(
                value = driverName,
                onValueChange = { driverName = it },
                label = { Text("Водитель") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            )
        }

        Text("Позиции", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = 12.dp))
        quantities.forEachIndexed { index, (article, name, qty) ->
            Row(
                Modifier.fillMaxWidth().padding(top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
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

        TextButton(
            enabled = !saving,
            onClick = {
                val bodies = quantities.mapNotNull { (article, name, qty) ->
                    val n = qty.toIntOrNull() ?: return@mapNotNull null
                    if (n <= 0) null else ShipmentItemBody(article, name, n)
                }
                onSubmit(method, vehicleInfo.ifBlank { null }, driverName.ifBlank { null }, bodies)
            },
            modifier = Modifier.padding(top = 8.dp),
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
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(ShipmentMethod.label(shipment.method), fontWeight = FontWeight.SemiBold)
                Text(if (shipment.shippedAt != null) "Отгружено" else "Не отгружено")
            }
            shipment.vehicleInfo?.let { Text("Авто: $it", style = MaterialTheme.typography.bodySmall) }
            shipment.driverName?.let { Text("Водитель: $it", style = MaterialTheme.typography.bodySmall) }
            shipment.items.forEach {
                Text("${it.article}: ${it.quantity} шт.", style = MaterialTheme.typography.bodySmall)
            }
            Row(Modifier.padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (shipment.shippedAt == null) {
                    TextButton(onClick = onMarkShipped) { Text("Отметить отгруженной") }
                } else {
                    TextButton(onClick = { onGenerateDocument("TTN") }) { Text("ТТН") }
                    TextButton(onClick = { onGenerateDocument("MX3") }) { Text("МХ-3") }
                }
            }
        }
    }
}

@Composable
private fun MarkShippedDialog(saving: Boolean, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var shippedBy by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Отметить отгруженной") },
        text = {
            OutlinedTextField(
                value = shippedBy,
                onValueChange = { shippedBy = it },
                label = { Text("Кто отгрузил") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            TextButton(enabled = !saving && shippedBy.isNotBlank(), onClick = { onConfirm(shippedBy) }) {
                Text("Подтвердить")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}
