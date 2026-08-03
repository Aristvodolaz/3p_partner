package com.npp.tsd.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
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
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
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
            NavigationBar {
                WorkspaceTab.entries.forEach { t ->
                    NavigationBarItem(
                        selected = tab == t,
                        onClick = { tab = t },
                        icon = { Icon(t.icon, contentDescription = t.label) },
                        label = {
                            Text(
                                t.label,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                style = MaterialTheme.typography.labelSmall,
                            )
                        },
                    )
                }
            }
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
