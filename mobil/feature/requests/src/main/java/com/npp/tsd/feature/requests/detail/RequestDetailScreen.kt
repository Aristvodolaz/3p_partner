package com.npp.tsd.feature.requests.detail

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
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
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.component.StatusBadge
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.RequestItemDetailed
import com.npp.tsd.core.model.RequestStatus

/**
 * Вкладка «Обзор» рабочего пространства заявки: статус, готовность операций,
 * список позиций. Приёмка/Хранение/Отгрузка/Документы — соседние вкладки
 * нижнего меню, задаются контейнером-workspace в :app.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestOverviewScreen(
    requestId: Int,
    requestsRepository: RequestsRepository,
    onOpenItem: (Int) -> Unit,
) {
    val vm: RequestDetailViewModel = viewModel(
        factory = viewModelFactory { initializer { RequestDetailViewModel(requestsRepository) } },
    )
    LaunchedEffect(requestId) { vm.load(requestId) }
    val state by vm.state.collectAsState()

    Scaffold { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))

            is UiState.Error -> FullScreenError(
                message = s.message,
                modifier = Modifier.padding(padding),
                onRetry = { vm.refresh() },
            )

            is UiState.Success -> {
                val request = s.data
                Column(Modifier.fillMaxSize().padding(padding)) {
                    Column(Modifier.fillMaxWidth().padding(Spacing.lg)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(request.partner.name, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            StatusDropdown(current = request.status, onSelect = { vm.setStatus(it) })
                        }
                        request.comment?.takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        Row(
                            Modifier.fillMaxWidth().padding(top = Spacing.md),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("Готовность операций", style = MaterialTheme.typography.labelMedium)
                            Text(
                                "${request.progress}%",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                        LinearProgressIndicator(
                            progress = { request.progress / 100f },
                            modifier = Modifier.fillMaxWidth().height(8.dp).padding(top = Spacing.xs),
                        )
                    }

                    if (request.items.isEmpty()) {
                        EmptyState(message = "В заявке нет позиций")
                    } else {
                        Text(
                            "Позиции",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.xs),
                        )
                        LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.md, vertical = Spacing.xs)) {
                            items(request.items, key = { it.id }) { item ->
                                ItemRow(item, onClick = { onOpenItem(item.id) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusDropdown(current: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.clickable { expanded = true },
        ) {
            StatusBadge(current, RequestStatus.colorHex(current))
            Icon(
                Icons.Filled.ArrowDropDown,
                contentDescription = "Сменить статус",
                modifier = Modifier.padding(start = 2.dp),
            )
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            RequestStatus.ALL.forEach { status ->
                DropdownMenuItem(
                    text = { Text(status) },
                    onClick = {
                        expanded = false
                        if (status != current) onSelect(status)
                    },
                )
            }
        }
    }
}

@Composable
private fun ItemRow(item: RequestItemDetailed, onClick: () -> Unit) {
    AppCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs),
        onClick = onClick,
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(item.article, fontWeight = FontWeight.SemiBold)
            Text("${item.opsDone}/${item.opsTotal} операций", style = MaterialTheme.typography.bodySmall)
        }
        Text(item.name ?: "—", style = MaterialTheme.typography.bodyMedium)
        Row(
            Modifier.fillMaxWidth().padding(top = Spacing.sm),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("Кол-во: ${item.quantity}" + (item.factQuantity?.let { " (факт: $it)" } ?: ""))
            item.totalCost?.let { Text("$it ₽") }
        }
        if (item.sku == null) {
            Text(
                "Артикул не найден в справочнике SKU",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = Spacing.xs),
            )
        }
    }
}
