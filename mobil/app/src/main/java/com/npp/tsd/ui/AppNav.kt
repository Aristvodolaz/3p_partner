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
import com.npp.tsd.feature.documents.DocumentsScreen
import com.npp.tsd.feature.receiving.ReceivingScreen
import com.npp.tsd.feature.requests.detail.RequestDetailScreen
import com.npp.tsd.feature.requests.itemdetail.ItemDetailScreen
import com.npp.tsd.feature.requests.list.RequestsListScreen
import com.npp.tsd.feature.settings.SettingsScreen
import com.npp.tsd.feature.shipping.ShippingScreen
import com.npp.tsd.feature.storage.StorageLookupScreen
import com.npp.tsd.feature.storage.StorageScreen

private object Routes {
    const val REQUESTS = "requests"
    const val STORAGE_LOOKUP = "storage_lookup"
    const val SETTINGS = "settings"

    const val REQUEST_DETAIL = "requests/{requestId}"
    const val ITEM_DETAIL = "requests/{requestId}/items/{itemId}"
    const val RECEIVING = "requests/{requestId}/receiving"
    const val REQUEST_STORAGE = "requests/{requestId}/storage"
    const val SHIPPING = "requests/{requestId}/shipping"
    const val DOCUMENTS = "requests/{requestId}/documents"

    fun requestDetail(id: Int) = "requests/$id"
    fun itemDetail(requestId: Int, itemId: Int) = "requests/$requestId/items/$itemId"
    fun receiving(id: Int) = "requests/$id/receiving"
    fun requestStorage(id: Int) = "requests/$id/storage"
    fun shipping(id: Int) = "requests/$id/shipping"
    fun documents(id: Int) = "requests/$id/documents"
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
                    onOpenRequest = { navController.navigate(Routes.requestDetail(it)) },
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

            composable(
                Routes.REQUEST_DETAIL,
                arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                RequestDetailScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    onBack = { navController.popBackStack() },
                    onOpenItem = { itemId -> navController.navigate(Routes.itemDetail(requestId, itemId)) },
                    onOpenReceiving = { navController.navigate(Routes.receiving(requestId)) },
                    onOpenStorage = { navController.navigate(Routes.requestStorage(requestId)) },
                    onOpenShipping = { navController.navigate(Routes.shipping(requestId)) },
                    onOpenDocuments = { navController.navigate(Routes.documents(requestId)) },
                )
            }

            composable(
                Routes.ITEM_DETAIL,
                arguments = listOf(
                    navArgument("requestId") { type = NavType.IntType },
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

            composable(
                Routes.RECEIVING,
                arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                ReceivingScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    warehouseRepository = container.warehouseRepository,
                    onBack = { navController.popBackStack() },
                )
            }

            composable(
                Routes.REQUEST_STORAGE,
                arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                StorageScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    warehouseRepository = container.warehouseRepository,
                    onBack = { navController.popBackStack() },
                )
            }

            composable(
                Routes.SHIPPING,
                arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                ShippingScreen(
                    requestId = requestId,
                    requestsRepository = container.requestsRepository,
                    warehouseRepository = container.warehouseRepository,
                    onBack = { navController.popBackStack() },
                )
            }

            composable(
                Routes.DOCUMENTS,
                arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
            ) { backStackEntry ->
                val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
                DocumentsScreen(
                    requestId = requestId,
                    warehouseRepository = container.warehouseRepository,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
