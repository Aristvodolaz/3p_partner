package com.npp.tsd.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.filled.Warehouse
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.npp.tsd.core.data.AuthRepository
import com.npp.tsd.core.model.EmployeeInfo
import kotlinx.coroutines.launch
import java.io.IOException

@Composable
fun LoginScreen(
    authRepository: AuthRepository,
    onLoggedIn: (EmployeeInfo) -> Unit,
    onOpenSettings: () -> Unit,
) {
    var employeeId by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun submit() {
        if (employeeId.isBlank() || isLoading) return
        isLoading = true
        error = null
        scope.launch {
            try {
                val employee = authRepository.login(employeeId.trim())
                onLoggedIn(employee)
            } catch (e: IOException) {
                error = "Не удалось подключиться к серверу. Проверьте сеть и адрес сервера в Настройках."
            } catch (e: Exception) {
                error = e.message ?: "Не удалось войти"
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Filled.Warehouse,
                contentDescription = null,
                modifier = Modifier.padding(bottom = 16.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Text("3P Partner ТСД", style = MaterialTheme.typography.headlineSmall)
            Text(
                "Введите ШК / табельный номер сотрудника",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp),
            )
            OutlinedTextField(
                value = employeeId,
                onValueChange = { employeeId = it; error = null },
                label = { Text("ШК сотрудника") },
                singleLine = true,
                isError = error != null,
                supportingText = error?.let { { Text(it) } },
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = { submit() },
                enabled = !isLoading && employeeId.isNotBlank(),
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp).padding(end = 8.dp),
                        strokeWidth = 2.dp,
                    )
                } else {
                    Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null, modifier = Modifier.padding(end = 8.dp))
                }
                Text(if (isLoading) "Вход..." else "Войти")
            }
            TextButton(onClick = onOpenSettings, modifier = Modifier.padding(top = 8.dp)) {
                Text("Настройки сервера")
            }
        }
    }
}
