package com.npp.tsd.ui.itemdetail

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import com.npp.tsd.data.model.ItemExecution
import com.npp.tsd.data.model.RequestItemDetailed
import com.npp.tsd.data.model.SkuOperationDetail
import com.npp.tsd.ui.common.UiState
import com.npp.tsd.ui.common.ViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItemDetailScreen(
    requestId: Int,
    itemId: Int,
    factory: ViewModelFactory,
    onBack: () -> Unit,
) {
    val vm: ItemDetailViewModel = viewModel(factory = factory)
    LaunchedEffect(requestId, itemId) { vm.load(requestId, itemId) }
    val state by vm.state.collectAsState()
    val saving by vm.saving.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        when (val s = state) {
                            is UiState.Success -> "Артикул ${s.data.article}"
                            else -> "Позиция"
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
                Text(s.message)
            }

            is UiState.Success -> {
                val item = s.data
                Column(Modifier.fillMaxSize().padding(padding)) {
                    ItemHeader(item, saving, onSaveFact = { qty, article -> vm.saveFact(qty, article) })

                    if (item.sku == null) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(
                                "Артикул «${item.article}» отсутствует в справочнике SKU.\nОперации недоступны.",
                                color = MaterialTheme.colorScheme.error,
                            )
                        }
                    } else {
                        LazyColumn(contentPadding = PaddingValues(12.dp)) {
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

    Column(Modifier.fillMaxWidth().padding(16.dp)) {
        Text(item.name ?: "—", fontWeight = FontWeight.SemiBold)
        item.sku?.specialMarks?.takeIf { it.isNotBlank() }?.let {
            Text("Отметки: $it", style = MaterialTheme.typography.bodySmall)
        }
        item.sku?.sumOfSides?.let {
            Text("ШДВ: $it см", style = MaterialTheme.typography.bodySmall)
        }
        Text("Заявлено: ${item.quantity} шт.", style = MaterialTheme.typography.bodyMedium)

        Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
        TextButton(
            enabled = !saving,
            onClick = {
                onSaveFact(factQty.toIntOrNull(), actualArticle.ifBlank { null })
            },
            modifier = Modifier.padding(top = 4.dp),
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

    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(10.dp)) {
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
                    Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
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
                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
                )
                TextButton(
                    enabled = !saving,
                    onClick = {
                        onSaveDetails(factQty.toIntOrNull(), isDefect, comment.ifBlank { null })
                        expanded = false
                    },
                    modifier = Modifier.padding(top = 4.dp),
                ) {
                    Text("Сохранить")
                }
            }
        }
    }
}
