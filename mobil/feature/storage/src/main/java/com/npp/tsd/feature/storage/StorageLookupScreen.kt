package com.npp.tsd.feature.storage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CompareArrows
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CenterAlignedTopAppBar
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.data.WarehouseZonesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.MovementType
import com.npp.tsd.core.model.StorageBalanceByArticle
import com.npp.tsd.core.model.StorageMovement

/** Верхнеуровневый экран «Склад» — поиск остатков по адресу, перемещение между адресами и лента движений. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageLookupScreen(warehouseRepository: WarehouseRepository, zonesRepository: WarehouseZonesRepository) {
    val vm: StorageLookupViewModel = viewModel(
        factory = viewModelFactory { initializer { StorageLookupViewModel(warehouseRepository) } },
    )
    val address by vm.address.collectAsState()
    val balanceState by vm.balanceState.collectAsState()
    val history by vm.history.collectAsState()
    val saving by vm.saving.collectAsState()
    val actionError by vm.actionError.collectAsState()

    var allAddresses by remember { mutableStateOf<List<String>>(emptyList()) }
    LaunchedEffect(Unit) {
        runCatching { zonesRepository.getAddresses() }.onSuccess { allAddresses = it.map { a -> a.code } }
    }

    var moveTarget by remember { mutableStateOf<StorageBalanceByArticle?>(null) }

    val snackbarHost = remember { SnackbarHostState() }
    LaunchedEffect(actionError) {
        actionError?.let {
            snackbarHost.showSnackbar(it)
            vm.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHost) },
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Склад") },
                windowInsets = WindowInsets(0, 0, 0, 0),
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            OutlinedTextField(
                value = address,
                onValueChange = { vm.setAddress(it) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.lg, vertical = Spacing.sm),
                label = { Text("Адрес ячейки") },
                placeholder = { Text("Например, A-01-01") },
                leadingIcon = { androidx.compose.material3.Icon(Icons.Filled.Search, contentDescription = null) },
                singleLine = true,
                keyboardActions = KeyboardActions(onSearch = { vm.search() }),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            )

            when (val s = balanceState) {
                is UiState.Loading -> FullScreenLoading()
                is UiState.Error -> FullScreenError(message = s.message)
                is UiState.Success -> {
                    if (s.data.isNotEmpty()) {
                        Text(
                            "Остатки на адресе «$address»",
                            style = MaterialTheme.typography.labelLarge,
                            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.xs),
                        )
                        Column(Modifier.padding(horizontal = Spacing.lg)) {
                            s.data.forEach { BalanceRow(it, onMove = { moveTarget = it }) }
                        }
                    }
                }
            }

            Text(
                "Последние перемещения",
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.sm),
            )
            if (history.isEmpty()) {
                EmptyState(message = "Перемещений пока не было", icon = Icons.Filled.Inventory2)
            } else {
                LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.lg, vertical = Spacing.xs)) {
                    items(history, key = { it.id }) { movement -> MovementRow(movement) }
                }
            }
        }
    }

    moveTarget?.let { balance ->
        MoveDialog(
            balance = balance,
            fromAddress = address,
            availableAddresses = allAddresses,
            saving = saving,
            onDismiss = { moveTarget = null },
            onConfirm = { toAddress, qty ->
                vm.move(balance.partnerId, balance.article, toAddress, qty)
                moveTarget = null
            },
        )
    }
}

@Composable
private fun BalanceRow(balance: StorageBalanceByArticle, onMove: () -> Unit) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(balance.article, fontWeight = FontWeight.Medium)
            Text("${balance.quantity} шт.")
        }
        OutlinedButton(onClick = onMove, modifier = Modifier.padding(top = Spacing.xs)) {
            androidx.compose.material3.Icon(Icons.AutoMirrored.Filled.CompareArrows, contentDescription = null, modifier = Modifier.size(16.dp))
            Text("Переместить", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(start = 4.dp))
        }
    }
}

@Composable
private fun MoveDialog(
    balance: StorageBalanceByArticle,
    fromAddress: String,
    availableAddresses: List<String>,
    saving: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (toAddress: String, quantity: Int) -> Unit,
) {
    var toAddress by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf(balance.quantity.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Переместить: ${balance.article}") },
        text = {
            Column {
                Text(
                    "С адреса «$fromAddress», доступно ${balance.quantity} шт.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = toAddress,
                    onValueChange = { toAddress = it },
                    label = { Text("Адрес-назначение") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
                )
                if (availableAddresses.isNotEmpty()) {
                    Row(
                        Modifier.fillMaxWidth().padding(top = Spacing.xs).horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        availableAddresses.filter { it != fromAddress }.forEach { code ->
                            FilterChip(
                                selected = toAddress == code,
                                onClick = { toAddress = code },
                                label = { Text(code) },
                            )
                        }
                    }
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
                enabled = !saving && toAddress.isNotBlank() && (quantity.toIntOrNull() ?: 0) > 0,
                onClick = { onConfirm(toAddress.trim(), quantity.toIntOrNull() ?: 0) },
            ) { Text(if (saving) "..." else "Подтвердить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

@Composable
private fun MovementRow(movement: StorageMovement) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(movement.article, fontWeight = FontWeight.Medium)
            Text(
                (if (movement.quantity > 0) "+" else "") + movement.quantity.toString(),
                color = if (movement.quantity > 0) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.error
                },
            )
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                "${MovementType.label(movement.type)} · ${movement.address}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                movement.createdAt.take(16).replace('T', ' '),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
