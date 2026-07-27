package com.npp.tsd.ui.storage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.npp.tsd.data.model.RequestItemDetailed
import com.npp.tsd.data.model.StorageBalanceByAddress
import com.npp.tsd.ui.common.UiState
import com.npp.tsd.ui.common.ViewModelFactory

private enum class StorageAction { PLACE, REMOVE, MOVE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageScreen(requestId: Int, factory: ViewModelFactory, onBack: () -> Unit) {
    val vm: StorageViewModel = viewModel(factory = factory)
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
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Хранение") },
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
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
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
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(item.article, fontWeight = FontWeight.SemiBold)
            Text(item.name ?: "—", style = MaterialTheme.typography.bodyMedium)

            if (balance.isEmpty()) {
                Text(
                    "Товар ещё не размещён",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp),
                )
            } else {
                Column(Modifier.padding(top = 6.dp)) {
                    balance.forEach {
                        Text("${it.address}: ${it.quantity} шт.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onPlace) { Text("Разместить") }
                TextButton(onClick = onMove, enabled = balance.isNotEmpty()) { Text("Переместить") }
                TextButton(onClick = onRemove, enabled = balance.isNotEmpty()) { Text("Снять") }
            }
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
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    )
                }
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it.filter(Char::isDigit) },
                    label = { Text("Количество") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
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
