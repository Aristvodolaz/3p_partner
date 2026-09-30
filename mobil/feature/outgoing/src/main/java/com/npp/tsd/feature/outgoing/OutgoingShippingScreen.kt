package com.npp.tsd.feature.outgoing

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CheckCircleOutline
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.npp.tsd.core.model.OutgoingItemOperation

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

    // Позиция, в которую "провалились" — экран со списком операций и
    // диалогом отгрузки вместо неё; null — показываем список позиций.
    var selectedItemId by remember { mutableStateOf<Int?>(null) }

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
            is UiState.Success -> {
                val selectedItem = s.data.items.find { it.id == selectedItemId }
                if (selectedItem != null) {
                    ItemProcessingScreen(
                        item = selectedItem,
                        saving = saving,
                        onBack = { selectedItemId = null },
                        onConfirm = { qty, final ->
                            vm.confirmItem(selectedItem.id, qty, final)
                            // "Завершить" закрывает позицию — возвращаемся в список, где она
                            // теперь уйдёт в "Уже отгружено". "Подтвердить" — частичный факт,
                            // остаёмся на позиции (см. обновлённые confirmedQuantity/операции).
                            if (final) selectedItemId = null
                        },
                        modifier = Modifier.padding(padding),
                    )
                } else {
                    ShippingItemsList(
                        delivery = s.data,
                        employeeName = employeeName,
                        onSelectItem = { selectedItemId = it.id },
                        modifier = Modifier.padding(padding),
                    )
                }
            }
        }
    }
}

@Composable
private fun ShippingItemsList(
    delivery: OutgoingDelivery,
    employeeName: String,
    onSelectItem: (OutgoingDeliveryItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    val pending = delivery.items.filter { it.factQuantity == null }
    val shipped = delivery.items.filter { it.factQuantity != null }

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
                    "К отгрузке — нажмите на позицию",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.xs),
                )
            }
        }

        items(pending, key = { it.id }) { item -> PendingItemRow(item, onClick = { onSelectItem(item) }) }
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
private fun PendingItemRow(item: OutgoingDeliveryItem, onClick: () -> Unit) {
    AppCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs),
        contentPadding = PaddingValues(Spacing.sm),
        onClick = onClick,
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
                Text(
                    "Заявлено: ${item.quantity}" +
                        if (item.operations.isNotEmpty()) " · операций: ${item.operations.size}" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun ItemProcessingScreen(
    item: OutgoingDeliveryItem,
    saving: Boolean,
    onBack: () -> Unit,
    onConfirm: (quantity: Int, final: Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    var showDialog by remember { mutableStateOf(false) }

    Column(modifier.fillMaxSize().padding(Spacing.lg)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
            }
            Column(Modifier.padding(start = Spacing.xs)) {
                Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Заявлено: ${item.quantity} · принято: ${item.confirmedQuantity}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        if (item.operations.isNotEmpty()) {
            Text(
                "Операции",
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.xs),
            )
            LazyColumn(Modifier.weight(1f)) {
                items(item.operations, key = { it.id }) { op -> OperationRow(op) }
            }
        } else {
            Box(Modifier.weight(1f))
        }

        Button(
            enabled = !saving,
            onClick = { showDialog = true },
            modifier = Modifier.fillMaxWidth().padding(top = Spacing.md),
        ) {
            Text(if (saving) "Сохранение..." else "Отгрузить")
        }
    }

    if (showDialog) {
        ShipConfirmDialog(
            declared = item.quantity,
            confirmedSoFar = item.confirmedQuantity,
            onDismiss = { showDialog = false },
            onConfirmPartial = { qty ->
                showDialog = false
                onConfirm(qty, false)
            },
            onFinish = { qty ->
                showDialog = false
                onConfirm(qty, true)
            },
        )
    }
}

@Composable
private fun OperationRow(op: OutgoingItemOperation) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text(op.operation.name, style = MaterialTheme.typography.bodyMedium)
                op.operation.unit?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Icon(
                if (op.done) Icons.Filled.CheckCircleOutline else Icons.Filled.RadioButtonUnchecked,
                contentDescription = if (op.done) "Выполнено" else "Не выполнено",
                tint = if (op.done) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Штучная отгрузка: "Подтвердить" отправляет введённое количество на
 * сервер как частичный факт (пишется в историю движений, позиция остаётся
 * открытой — можно вернуться и добавить ещё) и закрывает диалог; "Завершить"
 * отправляет введённое как последнюю партию и закрывает позицию целиком.
 * Оба действия шлют именно ДОБАВКУ к уже принятому (не итог) — сервер сам
 * копит confirmedQuantity.
 */
@Composable
private fun ShipConfirmDialog(
    declared: Int,
    confirmedSoFar: Int,
    onDismiss: () -> Unit,
    onConfirmPartial: (quantity: Int) -> Unit,
    onFinish: (quantity: Int) -> Unit,
) {
    var input by remember { mutableStateOf("") }
    val entered = input.toIntOrNull() ?: 0

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Отгрузка") },
        text = {
            Column {
                Text("Заявлено: $declared", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    "Фактически принято: $confirmedSoFar",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(top = Spacing.xs, bottom = Spacing.sm),
                )
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it.filter(Char::isDigit) },
                    label = { Text("Количество") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            Row {
                TextButton(enabled = entered > 0, onClick = { onConfirmPartial(entered) }) { Text("Подтвердить") }
                Button(enabled = entered > 0, onClick = { onFinish(entered) }) { Text("Завершить") }
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}
