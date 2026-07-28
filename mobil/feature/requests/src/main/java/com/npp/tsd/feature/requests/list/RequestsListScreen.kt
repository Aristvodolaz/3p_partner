package com.npp.tsd.feature.requests.list

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
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
import com.npp.tsd.core.model.PartnerRequest
import com.npp.tsd.core.model.RequestStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestsListScreen(
    requestsRepository: RequestsRepository,
    onOpenRequest: (Int, String) -> Unit,
    onOpenSettings: () -> Unit,
) {
    val vm: RequestsListViewModel = viewModel(
        factory = viewModelFactory { initializer { RequestsListViewModel(requestsRepository) } },
    )
    val state by vm.state.collectAsState()
    val showCompleted by vm.showCompleted.collectAsState()
    val search by vm.search.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Заявки партнёров") },
                actions = {
                    IconButton(onClick = { vm.load() }) {
                        Icon(Icons.Filled.Refresh, contentDescription = "Обновить")
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = "Настройки")
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(),
            )
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            OutlinedTextField(
                value = search,
                onValueChange = { vm.setSearch(it) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.md, vertical = Spacing.sm),
                placeholder = { Text("Поиск по номеру, артикулу...") },
                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                singleLine = true,
                keyboardActions = KeyboardActions(onSearch = { vm.applySearch() }),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.md),
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
                    label = { Text("Все заявки") },
                )
            }

            when (val s = state) {
                is UiState.Loading -> FullScreenLoading()

                is UiState.Error -> FullScreenError(message = s.message, onRetry = { vm.load() })

                is UiState.Success -> {
                    if (s.data.isEmpty()) {
                        EmptyState(
                            message = if (showCompleted) "Заявок нет" else "Нет заявок к выполнению",
                            icon = Icons.Filled.Inbox,
                        )
                    } else {
                        LazyColumn(contentPadding = PaddingValues(Spacing.md)) {
                            items(s.data, key = { it.id }) { request ->
                                RequestRow(request, onClick = { onOpenRequest(request.id, request.number) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RequestRow(request: PartnerRequest, onClick: () -> Unit) {
    AppCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs),
        onClick = onClick,
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("№ ${request.number}", fontWeight = FontWeight.SemiBold)
            StatusBadge(request.status, RequestStatus.colorHex(request.status))
        }
        Text(request.partner.name, modifier = Modifier.padding(top = 2.dp))
        Row(
            Modifier.fillMaxWidth().padding(top = Spacing.sm),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("Позиций: ${request.items.size}")
            request.requestDate?.let { Text(it.take(10)) }
        }
    }
}
