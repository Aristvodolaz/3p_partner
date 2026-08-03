package com.npp.tsd.feature.requests.packing

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import com.npp.tsd.core.designsystem.component.AppTopBar
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.PackingUnit
import com.npp.tsd.core.model.PackingUnitType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PackingScreen(
    requestId: Int,
    requestItemId: Int,
    requestsRepository: RequestsRepository,
    warehouseRepository: WarehouseRepository,
    onBack: () -> Unit,
) {
    val vm: PackingViewModel = viewModel(
        factory = viewModelFactory { initializer { PackingViewModel(warehouseRepository, requestsRepository) } },
    )
    LaunchedEffect(requestId, requestItemId) { vm.load(requestId, requestItemId) }
    val state by vm.state.collectAsState()
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
            AppTopBar(
                title = when (val s = state) {
                    is UiState.Success -> "Упаковка: ${s.data.article}"
                    else -> "Упаковка"
                },
                onBack = onBack,
            )
        },
        snackbarHost = { SnackbarHost(snackbarHost) },
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))
            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))
            is UiState.Success -> {
                val article = s.data.article
                val allowMixedBox = s.data.allowMixedBox
                val allUnits = s.data.units
                val myUnits = allUnits.filter { it.requestItemId == requestItemId }
                val pallets = allUnits.filter { it.type == PackingUnitType.PALLET }

                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(Spacing.lg),
                ) {
                    item {
                        NewUnitForm(
                            saving = saving,
                            onCreate = { type, code, expiry, nesting ->
                                vm.createUnit(requestItemId, type, code, expiry, nesting)
                            },
                        )
                    }
                    item {
                        Text(
                            "Паллеты и короба по позиции",
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(top = Spacing.xl, bottom = Spacing.sm),
                        )
                    }
                    if (myUnits.isEmpty()) {
                        item { EmptyState(message = "Пока не создано ни одной единицы упаковки", icon = Icons.Filled.Inventory2) }
                    } else {
                        items(myUnits, key = { it.id }) { unit ->
                            PackingUnitCard(
                                unit = unit,
                                pallets = pallets.filter { it.id != unit.id },
                                saving = saving,
                                allowMixedBox = allowMixedBox,
                                onAddItem = { qty -> vm.addItem(unit.id, requestItemId, article, qty) },
                                onComplete = { vm.complete(unit.id) },
                                onBindParent = { palletId -> vm.bindParent(unit.id, palletId) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NewUnitForm(
    saving: Boolean,
    onCreate: (type: String, code: String?, expiryDate: String?, nestingQty: Int?) -> Unit,
) {
    var type by remember { mutableStateOf(PackingUnitType.BOX) }
    var code by remember { mutableStateOf("") }
    var expiryDate by remember { mutableStateOf("") }
    var nestingQty by remember { mutableStateOf("") }

    Column {
        Text("Новая паллета/короб", style = MaterialTheme.typography.titleMedium)
        Row(Modifier.fillMaxWidth().padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            PackingUnitType.ALL.forEach { t ->
                FilterChip(selected = type == t, onClick = { type = t }, label = { Text(PackingUnitType.label(t)) })
            }
        }
        OutlinedTextField(
            value = code,
            onValueChange = { code = it },
            label = { Text("Код / ШК ВПС (необязательно)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm),
        )
        Row(Modifier.fillMaxWidth().padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            OutlinedTextField(
                value = expiryDate,
                onValueChange = { expiryDate = it },
                label = { Text("Срок годности (ГГГГ-ММ-ДД)") },
                singleLine = true,
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = nestingQty,
                onValueChange = { nestingQty = it.filter(Char::isDigit) },
                label = { Text("Вложенность") },
                singleLine = true,
                modifier = Modifier.width(120.dp),
            )
        }
        Button(
            enabled = !saving,
            onClick = {
                val isoDate = expiryDate.trim().takeIf { it.isNotBlank() }?.let { "${it}T00:00:00.000Z" }
                onCreate(type, code.ifBlank { null }, isoDate, nestingQty.toIntOrNull())
                code = ""; expiryDate = ""; nestingQty = ""
            },
            modifier = Modifier.padding(top = Spacing.sm),
        ) {
            Text(if (saving) "Сохранение..." else "Создать")
        }
    }
}

@Composable
private fun PackingUnitCard(
    unit: PackingUnit,
    pallets: List<PackingUnit>,
    saving: Boolean,
    allowMixedBox: Boolean,
    onAddItem: (Int) -> Unit,
    onComplete: () -> Unit,
    onBindParent: (Int) -> Unit,
) {
    var addQty by remember(unit.id) { mutableStateOf("") }
    var palletMenuOpen by remember { mutableStateOf(false) }
    val completed = unit.status == "COMPLETED"

    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("${PackingUnitType.label(unit.type)} · ${unit.code}", fontWeight = FontWeight.SemiBold)
            Text(if (completed) "Завершена" else "В работе", color = if (completed) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurfaceVariant)
        }
        unit.expiryDate?.let { Text("Срок годности: ${it.take(10)}", style = MaterialTheme.typography.bodySmall) }
        unit.nestingQty?.let { Text("Вложенность: $it", style = MaterialTheme.typography.bodySmall) }
        if (unit.parentPalletId != null) {
            Text("Привязан к паллете #${unit.parentPalletId}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
        }
        unit.items.forEach { i ->
            Text("${i.article}: ${i.quantity} шт.", style = MaterialTheme.typography.bodySmall)
        }
        if (unit.items.size > 1 && !allowMixedBox) {
            Text(
                "Микс артикулов разрешён для этого SKU",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.tertiary,
            )
        }

        if (!completed) {
            Row(
                Modifier.fillMaxWidth().padding(top = Spacing.sm),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = addQty,
                    onValueChange = { addQty = it.filter(Char::isDigit) },
                    label = { Text("Кол-во") },
                    singleLine = true,
                    modifier = Modifier.width(110.dp),
                )
                Button(
                    enabled = !saving && addQty.toIntOrNull() != null,
                    onClick = { addQty.toIntOrNull()?.let(onAddItem); addQty = "" },
                ) {
                    Text("Добавить")
                }
            }

            Row(Modifier.fillMaxWidth().padding(top = Spacing.sm), horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                if (unit.type == PackingUnitType.BOX && pallets.isNotEmpty()) {
                    androidx.compose.foundation.layout.Box {
                        OutlinedButton(onClick = { palletMenuOpen = true }) { Text("Привязать к паллете") }
                        DropdownMenu(expanded = palletMenuOpen, onDismissRequest = { palletMenuOpen = false }) {
                            pallets.forEach { p ->
                                DropdownMenuItem(
                                    text = { Text(p.code) },
                                    onClick = { onBindParent(p.id); palletMenuOpen = false },
                                )
                            }
                        }
                    }
                }
                Button(enabled = !saving, onClick = onComplete) { Text("Завершить упаковку") }
            }
        }
    }
}
