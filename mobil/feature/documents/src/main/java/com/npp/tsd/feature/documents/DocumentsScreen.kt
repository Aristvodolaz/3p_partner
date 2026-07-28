package com.npp.tsd.feature.documents

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
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
import com.npp.tsd.core.model.DocumentType
import com.npp.tsd.core.model.WarehouseDocument

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentsScreen(
    requestId: Int,
    warehouseRepository: WarehouseRepository,
) {
    val vm: DocumentsViewModel = viewModel(
        factory = viewModelFactory { initializer { DocumentsViewModel(warehouseRepository) } },
    )
    LaunchedEffect(requestId) { vm.load(requestId) }
    val state by vm.state.collectAsState()

    Scaffold { padding ->
        when (val s = state) {
            is UiState.Loading -> FullScreenLoading(Modifier.padding(padding))

            is UiState.Error -> FullScreenError(message = s.message, modifier = Modifier.padding(padding))

            is UiState.Success -> {
                if (s.data.isEmpty()) {
                    EmptyState(
                        message = "Документов пока нет",
                        icon = Icons.Filled.Description,
                        modifier = Modifier.padding(padding),
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentPadding = PaddingValues(Spacing.lg),
                    ) {
                        items(s.data, key = { it.id }) { doc -> DocumentRow(doc) }
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentRow(doc: WarehouseDocument) {
    AppCard(modifier = Modifier.fillMaxWidth().padding(vertical = Spacing.xs)) {
        Row(Modifier.fillMaxWidth()) {
            Text(DocumentType.label(doc.type), fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(end = Spacing.sm))
            Text(doc.number, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(
            "Сформирован: ${doc.createdAt.take(16).replace('T', ' ')} · ${doc.createdBy}",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}
