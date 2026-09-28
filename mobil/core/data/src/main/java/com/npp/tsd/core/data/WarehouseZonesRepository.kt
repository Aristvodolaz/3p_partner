package com.npp.tsd.core.data

import com.npp.tsd.core.network.ApiProvider

class WarehouseZonesRepository(private val settings: SettingsRepository) {

    private suspend fun api() = ApiProvider.get(settings.currentBaseUrl())

    suspend fun getAddresses(zoneType: String? = null, search: String? = null) =
        api().getStorageAddresses(zoneType, search)
}
