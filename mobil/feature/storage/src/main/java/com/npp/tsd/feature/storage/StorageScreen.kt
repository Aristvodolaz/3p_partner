package com.npp.tsd.feature.storage

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
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
import com.npp.tsd.core.model.RequestItemDetailed
import com.npp.tsd.core.model.StorageBalanceByAddress

private enum class StorageAction { PLACE, REMOVE, MOVE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageScreen(
    requestId: Int,
    requestsRepository: RequestsRepository,
    warehouseRepository: WarehouseRepository,
) {
    val vm: StorageViewModel = viewModel(
        factory = viewModelFactory {
            initializer { StorageViewModel(requestsRepository, warehouseRepository) }
        },
    )
    LaunchedEffect(requestId) { vm.load(requestId) }
    val state by vm.state.collectAsState()
    val balances by vm.balances.collectAsState()
    val saving by vm.saving.collectAsState()
    val actionError by vm.actionError.collectAsState()

    val snackbarHost = remember { SnackbarHostState() }
    LaunchedEffect(actionError) {
        actionError?.let {
            snackbarHost.showSnackbar(it)
            vm.clearError()
        }
    }

    var dialogTarget by remember { mutableStateOf<Pair<RequestItemDetailed, StorageAction>?>(null) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHost) },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))

            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))

            is UiState.Success -> {
                if (s.data.items.isEmpty()) {
                    EmptyState(message = "В заявке нет позиций", modifier = Modifier.padding(padding))
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentPadding = PaddingValues(Spacing.lg),
                    ) {
                        items(s.data.items, key = { it.id }) { item ->
                            StorageItemCard(
                                item = item,
                                balance = balances[item.article] ?: emptyList(),
                                onPlace = { dialogTarget = item to StorageAction.PLACE },
                                onRemove = { dialogTarget = item to StorageAction.REMOVE },
                                onMove = { dialogTarget = item to StorageAction.MOVE },
                            )
                        }
                    }
                }
            }
        }
    }

    dialogTarget?.let { (item, action) ->
        StorageActionDialog(
            item = item,
            action = action,
            balance = balances[item.article] ?: emptyList(),
            saving = saving,
            onDismiss = { dialogTarget = null },
            onConfirm = { address, toAddress, qty ->
                when (action) {
                    StorageAction.PLACE -> vm.place(item.article, address, qty, item.id)
                    StorageAction.REMOVE -> vm.remove(item.article, address, qty)
                    StorageAction.MOVE -> vm.move(item.article, address, toAddress ?: "", qty)
                }
                dialogTarget = null
            },
        )
    }
}

@Composable
private fun StorageItemCard(
    item: RequestItemDetailed,
    balance: List<StorageBalanceByAddress>,
    onPlace: () -> Unit,
    onRemove: () -> Unit,
    onMove: () -> Unit,
) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Text(item.article, fontWeight = FontWeight.SemiBold)
        Text(item.name ?: "—", style = MaterialTheme.typography.bodyMedium)

        if (balance.isEmpty()) {
            Text(
                "Товар ещё не размещён",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = Spacing.xs),
            )
        } else {
            Column(Modifier.padding(top = Spacing.xs)) {
                balance.forEach {
                    Text("${it.address}: ${it.quantity} шт.", style = MaterialTheme.typography.bodySmall)
                }
            }
        }

        Row(Modifier.padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            OutlinedButton(onClick = onPlace) { Text("Разместить") }
            OutlinedButton(onClick = onMove, enabled = balance.isNotEmpty()) { Text("Переместить") }
            OutlinedButton(onClick = onRemove, enabled = balance.isNotEmpty()) { Text("Снять") }
        }
    }
}

@Composable
private fun StorageActionDialog(
    item: RequestItemDetailed,
    action: StorageAction,
    balance: List<StorageBalanceByAddress>,
    saving: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (address: String, toAddress: String?, quantity: Int) -> Unit,
) {
    var address by remember { mutableStateOf(balance.firstOrNull()?.address ?: "") }
    var toAddress by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }

    val title = when (action) {
        StorageAction.PLACE -> "Разместить: ${item.article}"
        StorageAction.REMOVE -> "Снять с адреса: ${item.article}"
        StorageAction.MOVE -> "Переместить: ${item.article}"
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { androidx.compose.material3.Icon(Icons.Filled.Inventory2, contentDescription = null) },
        title = { Text(title) },
        text = {
            Column {
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text(if (action == StorageAction.MOVE) "Адрес-источник" else "Адрес ячейки") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                if (action == StorageAction.MOVE) {
                    OutlinedTextField(
                        value = toAddress,
                        onValueChange = { toAddress = it },
                        label = { Text("Адрес-назначение") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
                    )
                }
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it.filter(Char::isDigit) },
                    label = { Text("Количество") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = !saving && address.isNotBlank() && quantity.toIntOrNull() != null &&
                    (action != StorageAction.MOVE || toAddress.isNotBlank()),
                onClick = { onConfirm(address, toAddress.ifBlank { null }, quantity.toIntOrNull() ?: 0) },
            ) { Text("Подтвердить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}
