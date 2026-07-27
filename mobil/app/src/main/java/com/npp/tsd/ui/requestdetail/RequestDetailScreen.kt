package com.npp.tsd.ui.requestdetail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MoveToInbox
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import com.npp.tsd.data.model.RequestStatus
import com.npp.tsd.ui.common.StatusBadge
import com.npp.tsd.ui.common.UiState
import com.npp.tsd.ui.common.ViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestDetailScreen(
    requestId: Int,
    factory: ViewModelFactory,
    onBack: () -> Unit,
    onOpenItem: (Int) -> Unit,
    onOpenReceiving: (Int) -> Unit,
    onOpenStorage: (Int) -> Unit,
    onOpenShipping: (Int) -> Unit,
    onOpenDocuments: (Int) -> Unit,
) {
    val vm: RequestDetailViewModel = viewModel(factory = factory)
    androidx.compose.runtime.LaunchedEffect(requestId) { vm.load(requestId) }
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        when (val s = state) {
                            is UiState.Success -> "Заявка № ${s.data.number}"
                            else -> "Заявка"
                        },
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
            )
        },
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }

            is UiState.Error -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    TextButton(onClick = { vm.refresh() }) { Text("Повторить") }
                }
            }

            is UiState.Success -> {
                val request = s.data
                Column(Modifier.fillMaxSize().padding(padding)) {
                    Column(Modifier.fillMaxWidth().padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(request.partner.name, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            StatusBadge(request.status)
                        }
                        request.comment?.takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall)
                        }

                        Row(
                            Modifier.fillMaxWidth().padding(top = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("Готовность операций: ${request.progress}%")
                            StatusDropdown(current = request.status, onSelect = { vm.setStatus(it) })
                        }
                        LinearProgressIndicator(
                            progress = { request.progress / 100f },
                            modifier = Modifier.fillMaxWidth().height(8.dp).padding(top = 6.dp),
                        )

                        Row(
                            Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState())
                                .padding(top = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            AssistChip(
                                onClick = { onOpenReceiving(requestId) },
                                label = { Text("Приёмка") },
                                leadingIcon = { Icon(Icons.Filled.MoveToInbox, contentDescription = null, modifier = Modifier.height(18.dp)) },
                                colors = AssistChipDefaults.assistChipColors(),
                            )
                            AssistChip(
                                onClick = { onOpenStorage(requestId) },
                                label = { Text("Хранение") },
                                leadingIcon = { Icon(Icons.Filled.Inventory2, contentDescription = null, modifier = Modifier.height(18.dp)) },
                            )
                            AssistChip(
                                onClick = { onOpenShipping(requestId) },
                                label = { Text("Отгрузка") },
                                leadingIcon = { Icon(Icons.Filled.LocalShipping, contentDescription = null, modifier = Modifier.height(18.dp)) },
                            )
                            AssistChip(
                                onClick = { onOpenDocuments(requestId) },
                                label = { Text("Документы") },
                                leadingIcon = { Icon(Icons.Filled.Description, contentDescription = null, modifier = Modifier.height(18.dp)) },
                            )
                        }
                    }

                    LazyColumn(contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)) {
                        items(request.items, key = { it.id }) { item ->
                            ItemRow(item, onClick = { onOpenItem(item.id) })
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
        TextButton(onClick = { expanded = true }) { Text(current) }
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
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        onClick = onClick,
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(item.article, fontWeight = FontWeight.SemiBold)
                Text("${item.opsDone}/${item.opsTotal} операций")
            }
            Text(item.name ?: "—", style = MaterialTheme.typography.bodyMedium)
            Row(
                Modifier.fillMaxWidth().padding(top = 6.dp),
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
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
    }
}
