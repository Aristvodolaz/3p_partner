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
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.LocalShipping
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
import com.npp.tsd.feature.outgoing.OutgoingOverviewScreen
import com.npp.tsd.feature.outgoing.OutgoingShippingScreen

private enum class OutgoingTab(val label: String, val icon: ImageVector) {
    OVERVIEW("Обзор", Icons.AutoMirrored.Filled.ListAlt),
    SHIPPING("Отгрузка", Icons.Filled.LocalShipping),
}

/** Рабочее пространство ИСП: Обзор + Отгрузка, переключаются нижним мини-меню. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OutgoingWorkspaceScreen(
    deliveryId: Int,
    deliveryNumber: String,
    container: AppContainer,
    employeeName: String,
    onBack: () -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(OutgoingTab.OVERVIEW) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("ИСП № $deliveryNumber") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
                windowInsets = WindowInsets(0, 0, 0, 0),
            )
        },
        bottomBar = {
            OutgoingBottomBar(selected = tab, onSelect = { tab = it })
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                OutgoingTab.OVERVIEW -> OutgoingOverviewScreen(
                    deliveryId = deliveryId,
                    repository = container.outgoingDeliveriesRepository,
                )

                OutgoingTab.SHIPPING -> OutgoingShippingScreen(
                    deliveryId = deliveryId,
                    repository = container.outgoingDeliveriesRepository,
                    employeeName = employeeName,
                )
            }
        }
    }
}

@Composable
private fun OutgoingBottomBar(selected: OutgoingTab, onSelect: (OutgoingTab) -> Unit) {
    Surface(tonalElevation = 2.dp, shadowElevation = 2.dp) {
        Row(modifier = Modifier.fillMaxWidth().height(52.dp)) {
            OutgoingTab.entries.forEach { t ->
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
