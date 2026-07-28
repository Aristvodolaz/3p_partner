package com.npp.tsd.feature.requests.itemdetail

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
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
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.AppTopBar
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.ItemExecution
import com.npp.tsd.core.model.RequestItemDetailed
import com.npp.tsd.core.model.SkuOperationDetail

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItemDetailScreen(
    requestId: Int,
    itemId: Int,
    requestsRepository: RequestsRepository,
    onBack: () -> Unit,
) {
    val vm: ItemDetailViewModel = viewModel(
        factory = viewModelFactory { initializer { ItemDetailViewModel(requestsRepository) } },
    )
    LaunchedEffect(requestId, itemId) { vm.load(requestId, itemId) }
    val state by vm.state.collectAsState()
    val saving by vm.saving.collectAsState()

    Scaffold(
        topBar = {
            AppTopBar(
                title = when (val s = state) {
                    is UiState.Success -> "Артикул ${s.data.article}"
                    else -> "Позиция"
                },
                onBack = onBack,
            )
        },
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))

            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))

            is UiState.Success -> {
                val item = s.data
                Column(Modifier.fillMaxSize().padding(padding)) {
                    ItemHeader(item, saving, onSaveFact = { qty, article -> vm.saveFact(qty, article) })

                    if (item.sku == null) {
                        EmptyState(
                            message = "Артикул «${item.article}» отсутствует в справочнике SKU.\nОперации недоступны.",
                            icon = Icons.Filled.ReportProblem,
                        )
                    } else {
                        LazyColumn(contentPadding = PaddingValues(Spacing.md)) {
                            items(item.operationsWithState(), key = { it.first.operationId }) { (skuOp, exec) ->
                                OperationRow(
                                    skuOp = skuOp,
                                    execution = exec,
                                    saving = saving,
                                    onToggleDone = { done ->
                                        vm.toggleOperation(
                                            skuOp.operationId,
                                            done,
                                            exec?.factQty,
                                            exec?.isDefect ?: false,
                                            exec?.comment,
                                        )
                                    },
                                    onSaveDetails = { factQty, isDefect, comment ->
                                        vm.toggleOperation(
                                            skuOp.operationId,
                                            exec?.done ?: true,
                                            factQty,
                                            isDefect,
                                            comment,
                                        )
                                    },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemHeader(
    item: RequestItemDetailed,
    saving: Boolean,
    onSaveFact: (Int?, String?) -> Unit,
) {
    var factQty by remember(item.id) { mutableStateOf(item.factQuantity?.toString() ?: "") }
    var actualArticle by remember(item.id) { mutableStateOf(item.actualArticle ?: "") }

    Column(Modifier.fillMaxWidth().padding(Spacing.lg)) {
        Text(item.name ?: "—", fontWeight = FontWeight.SemiBold)
        item.sku?.specialMarks?.takeIf { it.isNotBlank() }?.let {
            Text("Отметки: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item.sku?.sumOfSides?.let {
            Text("ШДВ: $it см", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text("Заявлено: ${item.quantity} шт.", style = MaterialTheme.typography.bodyMedium)

        Row(Modifier.fillMaxWidth().padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            OutlinedTextField(
                value = factQty,
                onValueChange = { factQty = it.filter(Char::isDigit) },
                label = { Text("Кол-во по факту") },
                singleLine = true,
                modifier = Modifier.width(150.dp),
            )
            OutlinedTextField(
                value = actualArticle,
                onValueChange = { actualArticle = it },
                label = { Text("Артикул при пересорте") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Button(
            enabled = !saving,
            onClick = { onSaveFact(factQty.toIntOrNull(), actualArticle.ifBlank { null }) },
            modifier = Modifier.padding(top = Spacing.sm),
        ) {
            Text(if (saving) "Сохранение..." else "Сохранить факт")
        }
    }
}

@Composable
private fun OperationRow(
    skuOp: SkuOperationDetail,
    execution: ItemExecution?,
    saving: Boolean,
    onToggleDone: (Boolean) -> Unit,
    onSaveDetails: (Int?, Boolean, String?) -> Unit,
) {
    var expanded by remember(skuOp.operationId) { mutableStateOf(false) }
    var factQty by remember(skuOp.operationId, execution?.factQty) {
        mutableStateOf(execution?.factQty?.toString() ?: "")
    }
    var isDefect by remember(skuOp.operationId, execution?.isDefect) {
        mutableStateOf(execution?.isDefect ?: false)
    }
    var comment by remember(skuOp.operationId, execution?.comment) {
        mutableStateOf(execution?.comment ?: "")
    }

    AppCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs / 2),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(Spacing.sm),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = execution?.done ?: false,
                onCheckedChange = { onToggleDone(it) },
                enabled = !saving,
            )
            Column(Modifier.weight(1f)) {
                Text(skuOp.operation.name, fontWeight = FontWeight.Medium)
                Text(
                    listOfNotNull(skuOp.operation.unit, skuOp.value?.let { "кол-во: $it" })
                        .joinToString(" · "),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (execution?.isDefect == true) {
                Text("БРАК", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = { expanded = !expanded }) {
                Text(if (expanded) "Скрыть" else "Детали")
            }
        }

        if (expanded) {
            Row(
                Modifier.fillMaxWidth().padding(top = Spacing.xs),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = factQty,
                    onValueChange = { factQty = it.filter(Char::isDigit) },
                    label = { Text("Факт. кол-во") },
                    singleLine = true,
                    modifier = Modifier.width(140.dp),
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isDefect, onCheckedChange = { isDefect = it })
                    Text("Брак")
                }
            }
            OutlinedTextField(
                value = comment,
                onValueChange = { comment = it },
                label = { Text("Комментарий") },
                modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
            )
            Button(
                enabled = !saving,
                onClick = {
                    onSaveDetails(factQty.toIntOrNull(), isDefect, comment.ifBlank { null })
                    expanded = false
                },
                modifier = Modifier.padding(top = Spacing.sm),
            ) {
                Text("Сохранить")
            }
        }
    }
}
