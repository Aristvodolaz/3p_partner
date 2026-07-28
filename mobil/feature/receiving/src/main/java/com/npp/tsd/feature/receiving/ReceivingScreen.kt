package com.npp.tsd.feature.receiving

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.DiscrepancyType
import com.npp.tsd.core.model.Receipt
import com.npp.tsd.core.model.ReceiptItemBody
import com.npp.tsd.core.model.ReceiptType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReceivingScreen(
    requestId: Int,
    requestsRepository: RequestsRepository,
    warehouseRepository: WarehouseRepository,
) {
    val vm: ReceivingViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ReceivingViewModel(requestsRepository, warehouseRepository) }
        },
    )
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
        snackbarHost = { SnackbarHost(snackbarHost) },
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))

            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))

            is UiState.Success -> {
                val request = s.data
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(Spacing.lg),
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
                            modifier = Modifier.padding(top = Spacing.xl, bottom = Spacing.sm),
                        )
                    }
                    if (receipts.isEmpty()) {
                        item {
                            EmptyState(message = "Приёмок пока не было", icon = Icons.Filled.History)
                        }
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

        Row(Modifier.fillMaxWidth().padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
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
            modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
            singleLine = true,
        )

        Text("Позиции по заявке", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = Spacing.md))
        rows.forEach { row ->
            ReceiptItemRow(row)
        }

        Button(
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
            modifier = Modifier.padding(top = Spacing.sm),
        ) {
            Text(if (saving) "Сохранение..." else "Оформить приёмку")
        }
    }
}

@Composable
private fun ReceiptItemRow(row: ReceiptRow) {
    var acceptedQty by remember { mutableStateOf(row.acceptedQty) }
    var discrepancyType by remember { mutableStateOf(row.discrepancyType) }
    var comment by remember { mutableStateOf(row.discrepancyComment) }
    val hasDiscrepancy = acceptedQty.toIntOrNull() != row.expectedQty

    AppCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs),
        contentPadding = PaddingValues(Spacing.sm),
    ) {
        Text("${row.article} — ${row.name}", style = MaterialTheme.typography.bodyMedium)
        Row(
            Modifier.fillMaxWidth().padding(top = Spacing.xs),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
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
                modifier = Modifier.padding(top = Spacing.sm),
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
                modifier = Modifier.fillMaxWidth().padding(top = Spacing.xs),
            )
        }
    }
}

@Composable
private fun ReceiptCard(receipt: Receipt, onGenerateDocument: (String) -> Unit) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(ReceiptType.label(receipt.type), fontWeight = FontWeight.SemiBold)
            Text(receipt.createdAt.take(10), color = MaterialTheme.colorScheme.onSurfaceVariant)
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
        Row(Modifier.padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            OutlinedButton(onClick = { onGenerateDocument("MX1") }) { Text("МХ-1") }
            if (receipt.isPartial) {
                OutlinedButton(onClick = { onGenerateDocument("TORG2") }) { Text("ТОРГ-2") }
            }
        }
    }
}
