package com.npp.tsd.feature.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.npp.tsd.core.data.SettingsRepository
import com.npp.tsd.core.designsystem.component.AppTopBar
import com.npp.tsd.core.designsystem.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    settingsRepository: SettingsRepository,
    employeeName: String? = null,
    employeeRole: String? = null,
    onBack: () -> Unit,
    onLogout: () -> Unit = {},
) {
    val vm: SettingsViewModel = viewModel(
        factory = viewModelFactory { initializer { SettingsViewModel(settingsRepository) } },
    )
    val baseUrl by vm.baseUrl.collectAsState()
    val saved by vm.saved.collectAsState()

    Scaffold(
        topBar = { AppTopBar(title = "Настройки", onBack = onBack) },
    ) { padding ->
        Column(
            Modifier.fillMaxWidth().padding(padding).padding(Spacing.lg),
            verticalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                Icon(Icons.Filled.Dns, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Text("Сервер 3P Partner", style = MaterialTheme.typography.titleMedium)
            }
            Text(
                "Адрес backend-сервера, к которому подключается приложение",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = baseUrl,
                onValueChange = { vm.setUrl(it) },
                modifier = Modifier.fillMaxWidth().padding(top = Spacing.xs),
                placeholder = { Text("http://10.171.12.36:3032/api/v1/") },
                singleLine = true,
            )
            Button(onClick = { vm.save() }, modifier = Modifier.padding(top = Spacing.sm)) {
                Text("Сохранить")
            }
            if (saved) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.xs),
                    modifier = Modifier.padding(top = Spacing.xs),
                ) {
                    Icon(
                        Icons.Filled.CheckCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(end = 2.dp),
                    )
                    Text("Сохранено", color = MaterialTheme.colorScheme.primary)
                }
            }

            if (employeeName != null) {
                HorizontalDivider(modifier = Modifier.padding(vertical = Spacing.md))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    Icon(Icons.Filled.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text("Сотрудник", style = MaterialTheme.typography.titleMedium)
                }
                Text(employeeName, style = MaterialTheme.typography.bodyMedium)
                Text(
                    employeeRole ?: "роль не назначена",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedButton(onClick = onLogout, modifier = Modifier.padding(top = Spacing.sm)) {
                    Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, modifier = Modifier.padding(end = Spacing.xs))
                    Text("Выйти")
                }
            }
        }
    }
}
