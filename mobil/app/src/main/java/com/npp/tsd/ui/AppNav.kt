package com.npp.tsd.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.npp.tsd.AppContainer
import com.npp.tsd.ui.common.ViewModelFactory
import com.npp.tsd.ui.documents.DocumentsScreen
import com.npp.tsd.ui.itemdetail.ItemDetailScreen
import com.npp.tsd.ui.receiving.ReceivingScreen
import com.npp.tsd.ui.requestdetail.RequestDetailScreen
import com.npp.tsd.ui.requests.RequestsListScreen
import com.npp.tsd.ui.settings.SettingsScreen
import com.npp.tsd.ui.shipping.ShippingScreen
import com.npp.tsd.ui.storage.StorageScreen

private object Routes {
    const val LIST = "requests"
    const val DETAIL = "requests/{requestId}"
    const val ITEM = "requests/{requestId}/items/{itemId}"
    const val RECEIVING = "requests/{requestId}/receiving"
    const val STORAGE = "requests/{requestId}/storage"
    const val SHIPPING = "requests/{requestId}/shipping"
    const val DOCUMENTS = "requests/{requestId}/documents"
    const val SETTINGS = "settings"

    fun detail(requestId: Int) = "requests/$requestId"
    fun item(requestId: Int, itemId: Int) = "requests/$requestId/items/$itemId"
    fun receiving(requestId: Int) = "requests/$requestId/receiving"
    fun storage(requestId: Int) = "requests/$requestId/storage"
    fun shipping(requestId: Int) = "requests/$requestId/shipping"
    fun documents(requestId: Int) = "requests/$requestId/documents"
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
                onOpenReceiving = { navController.navigate(Routes.receiving(requestId)) },
                onOpenStorage = { navController.navigate(Routes.storage(requestId)) },
                onOpenShipping = { navController.navigate(Routes.shipping(requestId)) },
                onOpenDocuments = { navController.navigate(Routes.documents(requestId)) },
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
        composable(
            Routes.RECEIVING,
            arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
        ) { backStackEntry ->
            val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
            ReceivingScreen(requestId = requestId, factory = factory, onBack = { navController.popBackStack() })
        }
        composable(
            Routes.STORAGE,
            arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
        ) { backStackEntry ->
            val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
            StorageScreen(requestId = requestId, factory = factory, onBack = { navController.popBackStack() })
        }
        composable(
            Routes.SHIPPING,
            arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
        ) { backStackEntry ->
            val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
            ShippingScreen(requestId = requestId, factory = factory, onBack = { navController.popBackStack() })
        }
        composable(
            Routes.DOCUMENTS,
            arguments = listOf(navArgument("requestId") { type = NavType.IntType }),
        ) { backStackEntry ->
            val requestId = backStackEntry.arguments?.getInt("requestId") ?: return@composable
            DocumentsScreen(requestId = requestId, factory = factory, onBack = { navController.popBackStack() })
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(factory = factory, onBack = { navController.popBackStack() })
        }
    }
}
