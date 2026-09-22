package com.npp.tsd.feature.inventory

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
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
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
import com.npp.tsd.core.designsystem.component.StatusBadge
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.DocumentStatus
import com.npp.tsd.core.model.InventoryTask

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryTasksListScreen(
    repository: InventoryRepository,
    onOpenTask: (Int, String) -> Unit,
) {
    val vm: InventoryTasksListViewModel = viewModel(
        factory = viewModelFactory { initializer { InventoryTasksListViewModel(repository) } },
    )
    val state by vm.state.collectAsState()
    val showCompleted by vm.showCompleted.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Инвентаризация") },
                actions = {
                    IconButton(onClick = { vm.load() }) {
                        Icon(Icons.Filled.Refresh, contentDescription = "Обновить")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(),
                windowInsets = WindowInsets(0, 0, 0, 0),
            )
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.md, vertical = Spacing.sm),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
            ) {
                FilterChip(
                    selected = !showCompleted,
                    onClick = { if (showCompleted) vm.toggleShowCompleted() },
                    label = { Text("К выполнению") },
                )
                FilterChip(
                    selected = showCompleted,
                    onClick = { if (!showCompleted) vm.toggleShowCompleted() },
                    label = { Text("Все задания") },
                )
            }

            when (val s = state) {
                is UiState.Loading -> FullScreenLoading()

                is UiState.Error -> FullScreenError(message = s.message, onRetry = { vm.load() })

                is UiState.Success -> {
                    if (s.data.isEmpty()) {
                        EmptyState(
                            message = if (showCompleted) "Заданий нет" else "Нет заданий к выполнению",
                            icon = Icons.Filled.Inbox,
                        )
                    } else {
                        LazyColumn(contentPadding = PaddingValues(Spacing.md)) {
                            items(s.data, key = { it.id }) { task ->
                                InventoryTaskRow(task, onClick = { onOpenTask(task.id, task.number) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InventoryTaskRow(task: InventoryTask, onClick: () -> Unit) {
    AppCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs),
        onClick = onClick,
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("№ ${task.number}", fontWeight = FontWeight.SemiBold)
            StatusBadge(task.status, DocumentStatus.colorHex(task.status))
        }
        Text(task.partner?.name ?: "Внутренняя", modifier = Modifier.padding(top = 2.dp))
        Text(
            "Позиций: ${task.items.size}",
            modifier = Modifier.padding(top = Spacing.sm),
        )
    }
}
