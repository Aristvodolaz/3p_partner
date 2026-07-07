package com.npp.tsd.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.npp.tsd.ui.common.ViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(factory: ViewModelFactory, onBack: () -> Unit) {
    val vm: SettingsViewModel = viewModel(factory = factory)
    val baseUrl by vm.baseUrl.collectAsState()
    val saved by vm.saved.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Настройки") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxWidth().padding(padding).padding(16.dp)) {
            Text("Адрес сервера 3P Partner", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = baseUrl,
                onValueChange = { vm.setUrl(it) },
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                placeholder = { Text("http://10.171.12.36:3032/api/v1/") },
                singleLine = true,
            )
            Button(onClick = { vm.save() }, modifier = Modifier.padding(top = 12.dp)) {
                Text("Сохранить")
            }
            if (saved) {
                Text(
                    "Сохранено",
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}
