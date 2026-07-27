package com.npp.tsd.ui.receiving

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.toMutableStateList
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import com.npp.tsd.data.model.DiscrepancyType
import com.npp.tsd.data.model.Receipt
import com.npp.tsd.data.model.ReceiptItemBody
import com.npp.tsd.data.model.ReceiptType
import com.npp.tsd.ui.common.UiState
import com.npp.tsd.ui.common.ViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReceivingScreen(requestId: Int, factory: ViewModelFactory, onBack: () -> Unit) {
    val vm: ReceivingViewModel = viewModel(factory = factory)
    LaunchedEffect(requestId) { vm.load(requestId) }
    val state by vm.state.collectAsState()
    val receipts by vm.receipts.collectAsState()
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
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Приёмка товара") },
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
                val request = s.data
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                ) {
                    item {
                        NewReceiptForm(
                            items = request.items.map { it.article to (it.name ?: it.article) to it.quantity },
                            saving = saving,
                            onSubmit = { type, receivedBy, items -> vm.submitReceipt(type, receivedBy, items) },
                        )
                    }
                    item {
                        Text(
                            "История приёмок",
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(top = 20.dp, bottom = 8.dp),
                        )
                    }
                    if (receipts.isEmpty()) {
                        item { Text("Приёмок пока не было", color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    } else {
                        items(receipts, key = { it.id }) { receipt ->
                            ReceiptCard(receipt, onGenerateDocument = { type -> vm.generateDocument(receipt.id, type) })
                        }
                    }
                }
            }
        }
    }
}

private data class ReceiptRow(
    val article: String,
    val name: String,
    val expectedQty: Int,
    var acceptedQty: String,
    var discrepancyType: String?,
    var discrepancyComment: String,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NewReceiptForm(
    items: List<Pair<Pair<String, String>, Int>>,
    saving: Boolean,
    onSubmit: (type: String, receivedBy: String, items: List<ReceiptItemBody>) -> Unit,
) {
    var type by remember { mutableStateOf(ReceiptType.BOX) }
    var receivedBy by remember { mutableStateOf("") }
    val rows = remember(items) {
        items.map { (info, qty) ->
            ReceiptRow(info.first, info.second, qty, qty.toString(), null, "")
        }.toMutableStateList()
    }

    Column {
        Text("Новая приёмка", style = MaterialTheme.typography.titleMedium)

        Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ReceiptType.ALL.forEach { t ->
                FilterChip(
                    selected = type == t,
                    onClick = { type = t },
                    label = { Text(ReceiptType.label(t)) },
                )
            }
        }

        OutlinedTextField(
            value = receivedBy,
            onValueChange = { receivedBy = it },
            label = { Text("Кто принял") },
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            singleLine = true,
        )

        Text("Позиции по заявке", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = 12.dp))
        rows.forEach { row ->
            ReceiptItemRow(row)
        }

        TextButton(
            enabled = !saving && receivedBy.isNotBlank(),
            onClick = {
                val bodies = rows.map {
                    val accepted = it.acceptedQty.toIntOrNull() ?: 0
                    ReceiptItemBody(
                        article = it.article,
                        expectedQty = it.expectedQty,
                        acceptedQty = accepted,
                        discrepancyType = if (accepted != it.expectedQty) it.discrepancyType else null,
                        discrepancyComment = it.discrepancyComment.ifBlank { null },
                    )
                }
                onSubmit(type, receivedBy, bodies)
            },
            modifier = Modifier.padding(top = 8.dp),
        ) {
            Text(if (saving) "Сохранение..." else "Оформить приёмку")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ReceiptItemRow(row: ReceiptRow) {
    var acceptedQty by remember { mutableStateOf(row.acceptedQty) }
    var discrepancyType by remember { mutableStateOf(row.discrepancyType) }
    var comment by remember { mutableStateOf(row.discrepancyComment) }
    val hasDiscrepancy = acceptedQty.toIntOrNull() != row.expectedQty

    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.padding(10.dp)) {
            Text("${row.article} — ${row.name}", style = MaterialTheme.typography.bodyMedium)
            Row(
                Modifier.fillMaxWidth().padding(top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Заявлено: ${row.expectedQty}")
                OutlinedTextField(
                    value = acceptedQty,
                    onValueChange = {
                        acceptedQty = it.filter(Char::isDigit)
                        row.acceptedQty = acceptedQty
                    },
                    label = { Text("Принято") },
                    singleLine = true,
                    modifier = Modifier.width(110.dp),
                )
            }

            if (hasDiscrepancy) {
                Text(
                    "Тип расхождения",
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(top = 8.dp),
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    DiscrepancyType.ALL.forEach { d ->
                        FilterChip(
                            selected = discrepancyType == d,
                            onClick = {
                                discrepancyType = d
                                row.discrepancyType = d
                            },
                            label = { Text(DiscrepancyType.label(d)) },
                        )
                    }
                }
                OutlinedTextField(
                    value = comment,
                    onValueChange = {
                        comment = it
                        row.discrepancyComment = it
                    },
                    label = { Text("Комментарий к расхождению") },
                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
                )
            }
        }
    }
}

@Composable
private fun ReceiptCard(receipt: Receipt, onGenerateDocument: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(ReceiptType.label(receipt.type), fontWeight = FontWeight.SemiBold)
                Text(receipt.createdAt.take(10))
            }
            Text("Принял: ${receipt.receivedBy}", style = MaterialTheme.typography.bodySmall)
            if (receipt.isPartial) {
                Text(
                    "Частичная приёмка",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
            receipt.items.forEach { item ->
                Text(
                    "${item.article}: заявлено ${item.expectedQty}, принято ${item.acceptedQty}" +
                        (item.discrepancyType?.let { " (${DiscrepancyType.label(it)})" } ?: ""),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Row(Modifier.padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { onGenerateDocument("MX1") }) { Text("МХ-1") }
                if (receipt.isPartial) {
                    TextButton(onClick = { onGenerateDocument("TORG2") }) { Text("ТОРГ-2") }
                }
            }
        }
    }
}
