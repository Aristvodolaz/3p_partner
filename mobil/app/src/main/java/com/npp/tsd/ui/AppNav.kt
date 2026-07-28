package com.npp.tsd.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.Inventory2
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
import com.npp.tsd.AppContainer
import com.npp.tsd.feature.requests.itemdetail.ItemDetailScreen
import com.npp.tsd.feature.requests.list.RequestsListScreen
import com.npp.tsd.feature.settings.SettingsScreen
import com.npp.tsd.feature.storage.StorageLookupScreen
import java.net.URLDecoder
import java.net.URLEncoder

private object Routes {
    const val REQUESTS = "requests"
    const val STORAGE_LOOKUP = "storage_lookup"
    const val SETTINGS = "settings"

    const val REQUEST_WORKSPACE = "requests/{requestId}/{requestNumber}"
    const val ITEM_DETAIL = "requests/{requestId}/{requestNumber}/items/{itemId}"

    fun requestWorkspace(id: Int, number: String) =
        "requests/$id/${URLEncoder.encode(number, "UTF-8")}"

    fun itemDetail(requestId: Int, requestNumber: String, itemId: Int) =
        "requests/$requestId/${URLEncoder.encode(requestNumber, "UTF-8")}/items/$itemId"
}

private data class BottomTab(val route: String, val label: String, val icon: ImageVector)

private val bottomTabs = listOf(
    BottomTab(Routes.REQUESTS, "Заявки", Icons.AutoMirrored.Filled.ListAlt),
    BottomTab(Routes.STORAGE_LOOKUP, "Склад", Icons.Filled.Inventory2),
    BottomTab(Routes.SETTINGS, "Настройки", Icons.Filled.Settings),
)

@Composable
fun AppNav(container: AppContainer) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination

    val showBottomBar = bottomTabs.any { tab -> currentRoute?.hierarchy?.any { it.route == tab.route } == true }

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
            startDestination = Routes.REQUESTS,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.REQUESTS) {
                RequestsListScreen(
                    requestsRepository = container.requestsRepository,
                    onOpenRequest = { id, number -> navController.navigate(Routes.requestWorkspace(id, number)) },
                    onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                )
            }

            composable(Routes.STORAGE_LOOKUP) {
                StorageLookupScreen(warehouseRepository = container.warehouseRepository)
            }

            composable(Routes.SETTINGS) {
                SettingsScreen(
                    settingsRepository = container.settingsRepository,
                    onBack = { navController.popBackStack() },
                )
            }

            // Рабочее пространство заявки: Обзор/Приёмка/Хранение/Отгрузка/Документы
            // переключаются собственным нижним меню внутри RequestWorkspaceScreen.
            composable(
                Routes.REQUEST_WORKSPACE,
                arguments = listOf(
                    navArgument("requestId") { type = NavType.IntType },
                    navArgument("requestNumber") { type = NavType.StringType },
                ),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                val requestNumber = backStackEntry.arguments?.getString("requestNumber")
                    ?.let { URLDecoder.decode(it, "UTF-8") } ?: ""
                RequestWorkspaceScreen(
                    requestId = requestId,
                    requestNumber = requestNumber,
                    container = container,
                    onBack = { navController.popBackStack() },
                    onOpenItem = { itemId ->
                        navController.navigate(Routes.itemDetail(requestId, requestNumber, itemId))
                    },
                )
            }

            composable(
                Routes.ITEM_DETAIL,
                arguments = listOf(
                    navArgument("requestId") { type = NavType.IntType },
                    navArgument("requestNumber") { type = NavType.StringType },
                    navArgument("itemId") { type = NavType.IntType },
                ),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                val itemId = backStackEntry.arguments?.getInt("itemId") ?: return@composable
                ItemDetailScreen(
                    requestId = requestId,
                    itemId = itemId,
                    requestsRepository = container.requestsRepository,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
