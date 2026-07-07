package com.npp.tsd.ui.requests

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.npp.tsd.data.model.PartnerRequest
import com.npp.tsd.data.model.RequestStatus
import com.npp.tsd.ui.common.UiState
import com.npp.tsd.ui.common.ViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestsListScreen(
    factory: ViewModelFactory,
    onOpenRequest: (Int) -> Unit,
    onOpenSettings: () -> Unit,
) {
    val vm: RequestsListViewModel = viewModel(factory = factory)
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
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                placeholder = { Text("Поиск по номеру, артикулу...") },
                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                singleLine = true,
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(onSearch = { vm.applySearch() }),
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                    imeAction = androidx.compose.ui.text.input.ImeAction.Search,
                ),
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
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
                is UiState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }

                is UiState.Error -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(s.message)
                        TextButton(onClick = { vm.load() }) { Text("Повторить") }
                    }
                }

                is UiState.Success -> {
                    if (s.data.isEmpty()) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Заявок нет")
                        }
                    } else {
                        LazyColumn(contentPadding = PaddingValues(12.dp)) {
                            items(s.data, key = { it.id }) { request ->
                                RequestRow(request, onClick = { onOpenRequest(request.id) })
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
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        onClick = onClick,
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("№ ${request.number}", fontWeight = FontWeight.SemiBold)
                StatusBadge(request.status)
            }
            Text(request.partner.name, modifier = Modifier.padding(top = 2.dp))
            Row(
                Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Позиций: ${request.items.size}")
                request.requestDate?.let { Text(it.take(10)) }
            }
        }
    }
}

@Composable
private fun StatusBadge(status: String) {
    val (bg, fg) = when (status) {
        RequestStatus.DONE -> androidx.compose.ui.graphics.Color(0xFFDCFCE7) to androidx.compose.ui.graphics.Color(0xFF15803D)
        RequestStatus.IN_PROGRESS -> androidx.compose.ui.graphics.Color(0xFFDBEAFE) to androidx.compose.ui.graphics.Color(0xFF1D4ED8)
        RequestStatus.CANCELLED -> androidx.compose.ui.graphics.Color(0xFFFEE2E2) to androidx.compose.ui.graphics.Color(0xFFB91C1C)
        else -> androidx.compose.ui.graphics.Color(0xFFF3F4F6) to androidx.compose.ui.graphics.Color(0xFF4B5563)
    }
    androidx.compose.material3.Surface(
        color = bg,
        shape = RoundedCornerShape(50),
    ) {
        Text(
            status,
            color = fg,
            style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
        )
    }
}
