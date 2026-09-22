package com.npp.tsd.feature.inventory

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
import com.npp.tsd.core.data.InventoryRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.CountInventoryItemBody
import com.npp.tsd.core.model.InventoryTask
import com.npp.tsd.core.model.InventoryTaskItem

@Composable
fun InventoryCountScreen(
    taskId: Int,
    repository: InventoryRepository,
    employeeName: String,
) {
    val vm: InventoryTaskViewModel = viewModel(
        factory = viewModelFactory { initializer { InventoryTaskViewModel(repository) } },
    )
    LaunchedEffect(taskId) { vm.load(taskId) }
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
            is UiState.Success -> CountForm(
                task = s.data,
                saving = saving,
                employeeName = employeeName,
                onSubmit = { items -> vm.submitCount(items) },
                modifier = Modifier.padding(padding),
            )
        }
    }
}

private data class CountRow(
    val itemId: Int,
    val article: String,
    val name: String,
    val expectedQty: Int,
    var countedQty: String,
)

@Composable
private fun CountForm(
    task: InventoryTask,
    saving: Boolean,
    employeeName: String,
    onSubmit: (List<CountInventoryItemBody>) -> Unit,
    modifier: Modifier = Modifier,
) {
    val pending = task.items.filter { it.countedQty == null }
    val counted = task.items.filter { it.countedQty != null }

    val rows = remember(pending) {
        pending.map {
            CountRow(it.id, it.article, it.name ?: it.article, it.expectedQty, it.expectedQty.toString())
        }.toMutableStateList()
    }

    LazyColumn(modifier = modifier.fillMaxSize(), contentPadding = PaddingValues(Spacing.lg)) {
        item {
            Text("Пересчитал: $employeeName", style = MaterialTheme.typography.bodyMedium)

            if (counted.isNotEmpty()) {
                Text(
                    "Уже пересчитано",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.md, bottom = Spacing.xs),
                )
                counted.forEach { CountedRow(it) }
            }

            if (pending.isEmpty()) {
                EmptyState(message = "Все позиции уже пересчитаны", icon = Icons.Filled.CheckCircle)
            } else {
                Text(
                    "К пересчёту",
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
                            val qty = it.countedQty.toIntOrNull() ?: return@mapNotNull null
                            CountInventoryItemBody(it.itemId, qty)
                        }
                        onSubmit(bodies)
                    },
                    modifier = Modifier.padding(top = Spacing.md),
                ) {
                    Text(if (saving) "Сохранение..." else "Подтвердить пересчёт")
                }
            }
        }
    }
}

@Composable
private fun CountedRow(item: InventoryTaskItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "По учёту ${item.expectedQty}, факт ${item.countedQty}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun PendingRow(row: CountRow) {
    var countedQty by remember { mutableStateOf(row.countedQty) }
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs), contentPadding = PaddingValues(Spacing.sm)) {
        Text("${row.article} — ${row.name}", style = MaterialTheme.typography.bodyMedium)
        Text(
            "По учёту: ${row.expectedQty}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(
            Modifier.fillMaxWidth().padding(top = Spacing.xs),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            OutlinedTextField(
                value = countedQty,
                onValueChange = { input ->
                    val digits = input.filter(Char::isDigit)
                    countedQty = digits
                    row.countedQty = digits
                },
                label = { Text("Факт") },
                singleLine = true,
                modifier = Modifier.width(160.dp),
            )
        }
    }
}
