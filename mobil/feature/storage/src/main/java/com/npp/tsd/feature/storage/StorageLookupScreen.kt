package com.npp.tsd.feature.storage

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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.WarehouseRepository
import com.npp.tsd.core.designsystem.UiState
import com.npp.tsd.core.designsystem.component.AppCard
import com.npp.tsd.core.designsystem.component.EmptyState
import com.npp.tsd.core.designsystem.component.FullScreenError
import com.npp.tsd.core.designsystem.component.FullScreenLoading
import com.npp.tsd.core.designsystem.theme.Spacing
import com.npp.tsd.core.model.MovementType
import com.npp.tsd.core.model.StorageBalanceByArticle
import com.npp.tsd.core.model.StorageMovement

/** Верхнеуровневый экран «Склад» — поиск остатков по адресу и лента последних перемещений. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageLookupScreen(warehouseRepository: WarehouseRepository) {
    val vm: StorageLookupViewModel = viewModel(
        factory = viewModelFactory { initializer { StorageLookupViewModel(warehouseRepository) } },
    )
    val address by vm.address.collectAsState()
    val balanceState by vm.balanceState.collectAsState()
    val history by vm.history.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Склад") },
                windowInsets = WindowInsets(0, 0, 0, 0),
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            OutlinedTextField(
                value = address,
                onValueChange = { vm.setAddress(it) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = Spacing.lg, vertical = Spacing.sm),
                label = { Text("Адрес ячейки") },
                placeholder = { Text("Например, A-01-01") },
                leadingIcon = { androidx.compose.material3.Icon(Icons.Filled.Search, contentDescription = null) },
                singleLine = true,
                keyboardActions = KeyboardActions(onSearch = { vm.search() }),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            )

            when (val s = balanceState) {
                is UiState.Loading -> FullScreenLoading()
                is UiState.Error -> FullScreenError(message = s.message)
                is UiState.Success -> {
                    if (s.data.isNotEmpty()) {
                        Text(
                            "Остатки на адресе «$address»",
                            style = MaterialTheme.typography.labelLarge,
                            modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.xs),
                        )
                        Column(Modifier.padding(horizontal = Spacing.lg)) {
                            s.data.forEach { BalanceRow(it) }
                        }
                    }
                }
            }

            Text(
                "Последние перемещения",
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.sm),
            )
            if (history.isEmpty()) {
                EmptyState(message = "Перемещений пока не было", icon = Icons.Filled.Inventory2)
            } else {
                LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.lg, vertical = Spacing.xs)) {
                    items(history, key = { it.id }) { movement -> MovementRow(movement) }
                }
            }
        }
    }
}

@Composable
private fun BalanceRow(balance: StorageBalanceByArticle) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(balance.article, fontWeight = FontWeight.Medium)
            Text("${balance.quantity} шт.")
        }
    }
}

@Composable
private fun MovementRow(movement: StorageMovement) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(movement.article, fontWeight = FontWeight.Medium)
            Text(
                (if (movement.quantity > 0) "+" else "") + movement.quantity.toString(),
                color = if (movement.quantity > 0) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.error
                },
            )
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                "${MovementType.label(movement.type)} · ${movement.address}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                movement.createdAt.take(16).replace('T', ' '),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
