package com.npp.tsd.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.npp.tsd.AppContainer
import com.npp.tsd.feature.movementtasks.MovementTaskDetailScreen

/** Задание на перемещение — одна позиция подтверждается отдельно, поэтому без внутренних вкладок. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MovementTaskScreen(
    taskId: Int,
    taskNumber: String,
    container: AppContainer,
    onBack: () -> Unit,
) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Перемещение № $taskNumber") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
                windowInsets = WindowInsets(0, 0, 0, 0),
            )
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            MovementTaskDetailScreen(
                taskId = taskId,
                repository = container.movementTasksRepository,
                zonesRepository = container.warehouseZonesRepository,
            )
        }
    }
}
