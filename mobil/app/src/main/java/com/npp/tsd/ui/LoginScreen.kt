package com.npp.tsd.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.npp.tsd.core.data.AuthRepository
import com.npp.tsd.core.designsystem.theme.Blue30
import com.npp.tsd.core.designsystem.theme.Blue40
import com.npp.tsd.core.designsystem.theme.DisplayFontFamily
import com.npp.tsd.core.designsystem.theme.Gold40
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

    Scaffold(containerColor = androidx.compose.ui.graphics.Color.Transparent) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(Blue40, Blue30, Color(0xFF17140F)),
                        center = Offset(0.15f, -0.1f),
                        radius = 1400f,
                    ),
                )
                .padding(padding),
        ) {
            AnimatedVisibility(
                visible = true,
                enter = fadeIn(tween(450)) + slideInVertically(tween(450)) { it / 8 },
                modifier = Modifier.align(Alignment.Center),
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        "3P Partner",
                        fontFamily = DisplayFontFamily,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 34.sp,
                        color = Color.White,
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(top = 10.dp, bottom = 28.dp),
                    ) {
                        Box(Modifier.size(width = 20.dp, height = 1.dp).background(Gold40.copy(alpha = 0.7f)))
                        Text(
                            "ТСД · СКЛАД",
                            style = MaterialTheme.typography.labelSmall,
                            letterSpacing = 2.sp,
                            color = Color.White.copy(alpha = 0.55f),
                        )
                        Box(Modifier.size(width = 20.dp, height = 1.dp).background(Gold40.copy(alpha = 0.7f)))
                    }

                    Card(
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.padding(24.dp)) {
                            Text(
                                "Вход в систему",
                                fontFamily = DisplayFontFamily,
                                fontWeight = FontWeight.SemiBold,
                                style = MaterialTheme.typography.titleLarge,
                            )
                            Text(
                                "Введите табельный номер / ШК сотрудника",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 4.dp, bottom = 20.dp),
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
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth().height(48.dp).padding(top = 18.dp),
                            ) {
                                if (isLoading) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp).padding(end = 8.dp),
                                        strokeWidth = 2.dp,
                                    )
                                    Text("Вход...")
                                } else {
                                    Text("Войти")
                                    Icon(
                                        Icons.AutoMirrored.Filled.ArrowForward,
                                        contentDescription = null,
                                        modifier = Modifier.padding(start = 8.dp).size(16.dp),
                                    )
                                }
                            }
                            TextButton(
                                onClick = onOpenSettings,
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                            ) {
                                Text("Настройки сервера")
                            }
                        }
                    }

                    Text(
                        "Внутренняя система обработки заявок НПП",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.35f),
                        modifier = Modifier.padding(top = 24.dp),
                    )
                }
            }
        }
    }
}
