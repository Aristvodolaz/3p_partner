package com.npp.tsd.feature.inventory

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.InventoryRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.component.StatusBadge
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.DocumentStatus
import com.npp.tsd.core.model.InventoryTask
import com.npp.tsd.core.model.InventoryTaskItem

@Composable
fun InventoryOverviewScreen(
    taskId: Int,
    repository: InventoryRepository,
) {
    val vm: InventoryTaskViewModel = viewModel(
        factory = viewModelFactory { initializer { InventoryTaskViewModel(repository) } },
    )
    LaunchedEffect(taskId) { vm.load(taskId) }
    val state by vm.state.collectAsState()

    when (val s = state) {
        is UiState.Loading -> FullScreenLoading()
        is UiState.Error -> FullScreenError(message = s.message)
        is UiState.Success -> InventoryOverviewContent(s.data)
    }
}

@Composable
private fun InventoryOverviewContent(task: InventoryTask) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(Spacing.lg)) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Партнёр: ${task.partner?.name ?: "Внутренняя"}", style = MaterialTheme.typography.bodyMedium)
                StatusBadge(task.status, DocumentStatus.colorHex(task.status))
            }
            if (task.executors.isNotEmpty()) {
                Text(
                    "Исполнители: ${task.executors.joinToString(", ") { it.employeeId }}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = Spacing.xs),
                )
            }
            Text(
                "Позиции",
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(top = Spacing.lg, bottom = Spacing.sm),
            )
        }
        items(task.items, key = { it.id }) { item -> InventoryItemRow(item) }
    }
}

@Composable
private fun InventoryItemRow(item: InventoryTaskItem) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Text("${item.article} — ${item.name ?: item.article}", style = MaterialTheme.typography.bodyMedium)
        item.address?.let {
            Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(
            if (item.countedQty != null) {
                "По учёту: ${item.expectedQty} · факт: ${item.countedQty}"
            } else {
                "По учёту: ${item.expectedQty}"
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
