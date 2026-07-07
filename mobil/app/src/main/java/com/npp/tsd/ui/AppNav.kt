package com.npp.tsd.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.npp.tsd.AppContainer
import com.npp.tsd.ui.common.ViewModelFactory
import com.npp.tsd.ui.itemdetail.ItemDetailScreen
import com.npp.tsd.ui.requestdetail.RequestDetailScreen
import com.npp.tsd.ui.requests.RequestsListScreen
import com.npp.tsd.ui.settings.SettingsScreen

private object Routes {
    const val LIST = "requests"
    const val DETAIL = "requests/{requestId}"
    const val ITEM = "requests/{requestId}/items/{itemId}"
    const val SETTINGS = "settings"

    fun detail(requestId: Int) = "requests/$requestId"
    fun item(requestId: Int, itemId: Int) = "requests/$requestId/items/$itemId"
}

@Composable
fun AppNav(container: AppContainer) {
    val navController = rememberNavController()
    val factory = ViewModelFactory(container)

    NavHost(navController = navController, startDestination = Routes.LIST) {
        composable(Routes.LIST) {
            RequestsListScreen(
                factory = factory,
                onOpenRequest = { navController.navigate(Routes.detail(it)) },
                onOpenSettings = { navController.navigate(Routes.SETTINGS) },
            )
        }
        composable(
            Routes.DETAIL,
            arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
        ) { backStackEntry ->
            val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
            RequestDetailScreen(
                requestId = requestId,
                factory = factory,
                onBack = { navController.popBackStack() },
                onOpenItem = { itemId -> navController.navigate(Routes.item(requestId, itemId)) },
            )
        }
        composable(
            Routes.ITEM,
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
                factory = factory,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(factory = factory, onBack = { navController.popBackStack() })
        }
    }
}
