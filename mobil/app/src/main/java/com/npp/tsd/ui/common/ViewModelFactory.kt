package com.npp.tsd.ui.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.CreationExtras
import com.npp.tsd.AppContainer

class ViewModelFactory(private val container: AppContainer) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
        return when {
            modelClass.isAssignableFrom(com.npp.tsd.ui.requests.RequestsListViewModel::class.java) ->
                com.npp.tsd.ui.requests.RequestsListViewModel(container.requestsRepository) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.requestdetail.RequestDetailViewModel::class.java) ->
                com.npp.tsd.ui.requestdetail.RequestDetailViewModel(container.requestsRepository) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.itemdetail.ItemDetailViewModel::class.java) ->
                com.npp.tsd.ui.itemdetail.ItemDetailViewModel(container.requestsRepository) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.settings.SettingsViewModel::class.java) ->
                com.npp.tsd.ui.settings.SettingsViewModel(container.settingsRepository) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.receiving.ReceivingViewModel::class.java) ->
                com.npp.tsd.ui.receiving.ReceivingViewModel(
                    container.requestsRepository,
                    container.warehouseRepository,
                ) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.storage.StorageViewModel::class.java) ->
                com.npp.tsd.ui.storage.StorageViewModel(
                    container.requestsRepository,
                    container.warehouseRepository,
                ) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.shipping.ShippingViewModel::class.java) ->
                com.npp.tsd.ui.shipping.ShippingViewModel(
                    container.requestsRepository,
                    container.warehouseRepository,
                ) as T

            modelClass.isAssignableFrom(com.npp.tsd.ui.documents.DocumentsViewModel::class.java) ->
                com.npp.tsd.ui.documents.DocumentsViewModel(container.warehouseRepository) as T

            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
