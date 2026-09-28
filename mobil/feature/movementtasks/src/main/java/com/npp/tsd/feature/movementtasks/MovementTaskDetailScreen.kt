package com.npp.tsd.feature.movementtasks

import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.MovementTasksRepository
import com.npp.tsd.core.data.WarehouseZonesRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.MovementTask
import com.npp.tsd.core.model.MovementTaskItem
import com.npp.tsd.core.model.ZoneType

@Composable
fun MovementTaskDetailScreen(
    taskId: Int,
    repository: MovementTasksRepository,
    zonesRepository: WarehouseZonesRepository,
) {
    val vm: MovementTaskViewModel = viewModel(
        factory = viewModelFactory { initializer { MovementTaskViewModel(repository) } },
    )
    LaunchedEffect(taskId) { vm.load(taskId) }
    val state by vm.state.collectAsState()
    val confirmingItemId by vm.confirmingItemId.collectAsState()
    val actionError by vm.actionError.collectAsState()

    // Адреса зоны обработки (W) — подсказка при подтверждении перемещения.
    var processingAddresses by remember { mutableStateOf<List<String>>(emptyList()) }
    LaunchedEffect(Unit) {
        runCatching { zonesRepository.getAddresses(zoneType = ZoneType.PROCESSING) }
            .onSuccess { processingAddresses = it.map { a -> a.code } }
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
            is UiState.Success -> TaskDetail(
                task = s.data,
                confirmingItemId = confirmingItemId,
                processingAddresses = processingAddresses,
                onConfirm = { itemId, address -> vm.confirmItem(itemId, address) },
                modifier = Modifier.padding(padding),
            )
        }
    }
}

@Composable
private fun TaskDetail(
    task: MovementTask,
    confirmingItemId: Int?,
    processingAddresses: List<String>,
    onConfirm: (Int, String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val pending = task.items.filter { it.status != "Перемещено" }
    val done = task.items.filter { it.status == "Перемещено" }

    LazyColumn(modifier = modifier.fillMaxSize(), contentPadding = PaddingValues(Spacing.lg)) {
        item {
            Text(
                "Из зоны хранения (S) в зону обработки (W). Выберите позицию и укажите адрес, " +
                    "куда фактически переместили товар.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (done.isNotEmpty()) {
                Text(
                    "Перемещено",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.md, bottom = Spacing.xs),
                )
                done.forEach { DoneRow(it) }
            }

            if (pending.isEmpty()) {
                EmptyState(message = "Все позиции перемещены", icon = Icons.Filled.CheckCircle)
            } else {
                Text(
                    "К перемещению",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.xs),
                )
            }
        }

        if (pending.isNotEmpty()) {
            items(pending, key = { it.id }) { item ->
                PendingItemRow(
                    item = item,
                    saving = confirmingItemId == item.id,
                    processingAddresses = processingAddresses,
                    onConfirm = { address -> onConfirm(item.id, address) },
                )
            }
        }
    }
}

@Composable
private fun DoneRow(item: MovementTaskItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "Перемещено: ${item.quantity} шт. · ${item.confirmedBy ?: ""}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun PendingItemRow(
    item: MovementTaskItem,
    saving: Boolean,
    processingAddresses: List<String>,
    onConfirm: (String) -> Unit,
) {
    var address by remember(item.id) { mutableStateOf("") }
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "Количество: ${item.quantity}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(
            Modifier.fillMaxWidth().padding(top = Spacing.xs),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("Адрес зоны обработки") },
                singleLine = true,
                modifier = Modifier.width(200.dp),
            )
            Button(enabled = !saving, onClick = { onConfirm(address) }) {
                Text(if (saving) "..." else "Подтвердить")
            }
        }
        if (processingAddresses.isNotEmpty()) {
            Row(
                Modifier.fillMaxWidth().padding(top = Spacing.xs).horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                processingAddresses.forEach { code ->
                    FilterChip(
                        selected = address == code,
                        onClick = { address = code },
                        label = { Text(code) },
                    )
                }
            }
        }
    }
}
