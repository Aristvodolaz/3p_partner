package com.npp.tsd.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.npp.tsd.AppContainer
import com.npp.tsd.feature.inventory.InventoryCountScreen
import com.npp.tsd.feature.inventory.InventoryOverviewScreen

private enum class InventoryTab(val label: String, val icon: ImageVector) {
    OVERVIEW("Обзор", Icons.AutoMirrored.Filled.ListAlt),
    COUNT("Пересчёт", Icons.Filled.FactCheck),
}

/** Рабочее пространство задания на инвентаризацию: Обзор + Пересчёт. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryWorkspaceScreen(
    taskId: Int,
    taskNumber: String,
    container: AppContainer,
    employeeName: String,
    onBack: () -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(InventoryTab.OVERVIEW) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Инвентаризация № $taskNumber") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
                windowInsets = WindowInsets(0, 0, 0, 0),
            )
        },
        bottomBar = {
            InventoryBottomBar(selected = tab, onSelect = { tab = it })
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                InventoryTab.OVERVIEW -> InventoryOverviewScreen(
                    taskId = taskId,
                    repository = container.inventoryRepository,
                )

                InventoryTab.COUNT -> InventoryCountScreen(
                    taskId = taskId,
                    repository = container.inventoryRepository,
                    employeeName = employeeName,
                )
            }
        }
    }
}

@Composable
private fun InventoryBottomBar(selected: InventoryTab, onSelect: (InventoryTab) -> Unit) {
    Surface(tonalElevation = 2.dp, shadowElevation = 2.dp) {
        Row(modifier = Modifier.fillMaxWidth().height(52.dp)) {
            InventoryTab.entries.forEach { t ->
                val isSelected = t == selected
                val tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize()
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = { onSelect(t) },
                        ),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Icon(t.icon, contentDescription = t.label, tint = tint, modifier = Modifier.size(20.dp))
                    Text(t.label, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.labelSmall, color = tint)
                }
            }
        }
    }
}
