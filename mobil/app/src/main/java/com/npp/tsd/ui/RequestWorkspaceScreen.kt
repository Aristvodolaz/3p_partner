package com.npp.tsd.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MoveToInbox
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
import com.npp.tsd.feature.documents.DocumentsScreen
import com.npp.tsd.feature.receiving.ReceivingScreen
import com.npp.tsd.feature.requests.detail.RequestOverviewScreen
import com.npp.tsd.feature.shipping.ShippingScreen
import com.npp.tsd.feature.storage.StorageScreen

private enum class WorkspaceTab(val label: String, val icon: ImageVector) {
    OVERVIEW("Обзор", Icons.AutoMirrored.Filled.ListAlt),
    RECEIVING("Приёмка", Icons.Filled.MoveToInbox),
    // "Склад", а не "Хранение" — тот же термин, что и в верхнем нижнем меню
    // (вкладка "Склад"), плюс короче и не переносится на 5 вкладках.
    STORAGE("Склад", Icons.Filled.Inventory2),
    SHIPPING("Отгрузка", Icons.Filled.LocalShipping),
    DOCUMENTS("Документы", Icons.Filled.Description),
}

/**
 * Рабочее пространство заявки: единая шапка с номером заявки и назад,
 * а Обзор/Приёмка/Хранение/Отгрузка/Документы переключаются нижним меню
 * без отдельной кнопки «Назад» на каждом экране.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestWorkspaceScreen(
    requestId: Int,
    requestNumber: String,
    container: AppContainer,
    employeeName: String,
    onBack: () -> Unit,
    onOpenItem: (Int) -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(WorkspaceTab.OVERVIEW) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Заявка № $requestNumber") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
            )
        },
        bottomBar = {
            WorkspaceBottomBar(selected = tab, onSelect = { tab = it })
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                WorkspaceTab.OVERVIEW -> RequestOverviewScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    onOpenItem = onOpenItem,
                )

                WorkspaceTab.RECEIVING -> ReceivingScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    warehouseRepository = container.warehouseRepository,
                    employeeName = employeeName,
                )

                WorkspaceTab.STORAGE -> StorageScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    warehouseRepository = container.warehouseRepository,
                )

                WorkspaceTab.SHIPPING -> ShippingScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    warehouseRepository = container.warehouseRepository,
                    employeeName = employeeName,
                )

                WorkspaceTab.DOCUMENTS -> DocumentsScreen(
                    requestId = requestId,
                    warehouseRepository = container.warehouseRepository,
                )
            }
        }
    }
}

/**
 * Компактная нижняя панель вкладок заявки — без встроенных отступов Material3
 * [androidx.compose.material3.NavigationBar] (там фиксированная высота 80dp,
 * не сжимаемая через модификаторы). Системный отступ снизу добавляется явно
 * через windowInsetsPadding, поверх него — фиксированная компактная высота.
 */
@Composable
private fun WorkspaceBottomBar(selected: WorkspaceTab, onSelect: (WorkspaceTab) -> Unit) {
    Surface(tonalElevation = 2.dp, shadowElevation = 2.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.navigationBars)
                .height(52.dp),
        ) {
            WorkspaceTab.entries.forEach { t ->
                val isSelected = t == selected
                val tint = if (isSelected) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
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
                    Text(
                        t.label,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.labelSmall,
                        color = tint,
                    )
                }
            }
        }
    }
}
