package com.npp.tsd.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MoveToInbox
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.npp.tsd.AppContainer
import com.npp.tsd.core.model.EmployeeInfo
import com.npp.tsd.feature.incoming.IncomingDeliveriesListScreen
import com.npp.tsd.feature.inventory.InventoryTasksListScreen
import com.npp.tsd.feature.outgoing.OutgoingDeliveriesListScreen
import com.npp.tsd.feature.settings.SettingsScreen
import com.npp.tsd.feature.storage.StorageLookupScreen
import kotlinx.coroutines.launch
import java.net.URLDecoder
import java.net.URLEncoder

private object Routes {
    const val LOGIN = "login"
    const val INCOMING = "incoming"
    const val OUTGOING = "outgoing"
    const val INVENTORY = "inventory"
    const val STORAGE_LOOKUP = "storage_lookup"
    const val SETTINGS = "settings"

    const val INCOMING_WORKSPACE = "incoming/{deliveryId}/{deliveryNumber}"
    const val OUTGOING_WORKSPACE = "outgoing/{deliveryId}/{deliveryNumber}"
    const val INVENTORY_WORKSPACE = "inventory/{taskId}/{taskNumber}"

    fun incomingWorkspace(id: Int, number: String) =
        "incoming/$id/${URLEncoder.encode(number, "UTF-8")}"

    fun outgoingWorkspace(id: Int, number: String) =
        "outgoing/$id/${URLEncoder.encode(number, "UTF-8")}"

    fun inventoryWorkspace(id: Int, number: String) =
        "inventory/$id/${URLEncoder.encode(number, "UTF-8")}"
}

private data class BottomTab(val route: String, val label: String, val icon: ImageVector)

private val bottomTabs = listOf(
    BottomTab(Routes.INCOMING, "ВХП", Icons.Filled.MoveToInbox),
    BottomTab(Routes.OUTGOING, "ИСП", Icons.Filled.LocalShipping),
    BottomTab(Routes.INVENTORY, "Инв.", Icons.Filled.FactCheck),
    BottomTab(Routes.STORAGE_LOOKUP, "Склад", Icons.Filled.Inventory2),
    BottomTab(Routes.SETTINGS, "Настройки", Icons.Filled.Settings),
)

@Composable
fun AppNav(container: AppContainer, initialEmployee: EmployeeInfo?) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination
    val scope = rememberCoroutineScope()
    var employee by remember { mutableStateOf(initialEmployee) }

    val showBottomBar = employee != null &&
        bottomTabs.any { tab -> currentRoute?.hierarchy?.any { it.route == tab.route } == true }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomTabs.forEach { tab ->
                        val selected = currentRoute?.hierarchy?.any { it.route == tab.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (employee != null) Routes.INCOMING else Routes.LOGIN,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.LOGIN) {
                LoginScreen(
                    authRepository = container.authRepository,
                    onLoggedIn = { emp ->
                        employee = emp
                        navController.navigate(Routes.INCOMING) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    },
                    onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                )
            }

            composable(Routes.INCOMING) {
                IncomingDeliveriesListScreen(
                    repository = container.incomingDeliveriesRepository,
                    onOpenDelivery = { id, number -> navController.navigate(Routes.incomingWorkspace(id, number)) },
                )
            }

            composable(Routes.OUTGOING) {
                OutgoingDeliveriesListScreen(
                    repository = container.outgoingDeliveriesRepository,
                    onOpenDelivery = { id, number -> navController.navigate(Routes.outgoingWorkspace(id, number)) },
                )
            }

            composable(Routes.INVENTORY) {
                InventoryTasksListScreen(
                    repository = container.inventoryRepository,
                    onOpenTask = { id, number -> navController.navigate(Routes.inventoryWorkspace(id, number)) },
                )
            }

            composable(Routes.STORAGE_LOOKUP) {
                StorageLookupScreen(warehouseRepository = container.warehouseRepository)
            }

            composable(Routes.SETTINGS) {
                SettingsScreen(
                    settingsRepository = container.settingsRepository,
                    employeeName = employee?.fullName,
                    employeeRole = employee?.role,
                    onBack = { navController.popBackStack() },
                    onLogout = {
                        scope.launch {
                            container.authRepository.logout()
                            employee = null
                            navController.navigate(Routes.LOGIN) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                )
            }

            // Рабочие пространства новых документов: Обзор + действие (Приёмка/Отгрузка/Пересчёт)
            // переключаются собственным нижним меню внутри каждого *WorkspaceScreen.
            composable(
                Routes.INCOMING_WORKSPACE,
                arguments = listOf(
                    navArgument("deliveryId") { type = NavType.IntType },
                    navArgument("deliveryNumber") { type = NavType.StringType },
                ),
            ) { backStackEntry ->
                val deliveryId = backStackEntry.arguments?.getInt("deliveryId") ?: return@composable
                val deliveryNumber = backStackEntry.arguments?.getString("deliveryNumber")
                    ?.let { URLDecoder.decode(it, "UTF-8") } ?: ""
                IncomingWorkspaceScreen(
                    deliveryId = deliveryId,
                    deliveryNumber = deliveryNumber,
                    container = container,
                    employeeName = employee?.fullName ?: "—",
                    onBack = { navController.popBackStack() },
                )
            }

            composable(
                Routes.OUTGOING_WORKSPACE,
                arguments = listOf(
                    navArgument("deliveryId") { type = NavType.IntType },
                    navArgument("deliveryNumber") { type = NavType.StringType },
                ),
            ) { backStackEntry ->
                val deliveryId = backStackEntry.arguments?.getInt("deliveryId") ?: return@composable
                val deliveryNumber = backStackEntry.arguments?.getString("deliveryNumber")
                    ?.let { URLDecoder.decode(it, "UTF-8") } ?: ""
                OutgoingWorkspaceScreen(
                    deliveryId = deliveryId,
                    deliveryNumber = deliveryNumber,
                    container = container,
                    employeeName = employee?.fullName ?: "—",
                    onBack = { navController.popBackStack() },
                )
            }

            composable(
                Routes.INVENTORY_WORKSPACE,
                arguments = listOf(
                    navArgument("taskId") { type = NavType.IntType },
                    navArgument("taskNumber") { type = NavType.StringType },
                ),
            ) { backStackEntry ->
                val taskId = backStackEntry.arguments?.getInt("taskId") ?: return@composable
                val taskNumber = backStackEntry.arguments?.getString("taskNumber")
                    ?.let { URLDecoder.decode(it, "UTF-8") } ?: ""
                InventoryWorkspaceScreen(
                    taskId = taskId,
                    taskNumber = taskNumber,
                    container = container,
                    employeeName = employee?.fullName ?: "—",
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
