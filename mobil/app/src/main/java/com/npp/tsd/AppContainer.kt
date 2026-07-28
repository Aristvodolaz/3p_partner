package com.npp.tsd

import android.content.Context
import com.npp.tsd.core.data.RequestsRepository
import com.npp.tsd.core.data.SettingsRepository
import com.npp.tsd.core.data.WarehouseRepository

/** Композиционный корень: единственное место, где создаются репозитории. */
class AppContainer(context: Context) {
    val settingsRepository = SettingsRepository(context.applicationContext)
    val requestsRepository = RequestsRepository(settingsRepository)
    val warehouseRepository = WarehouseRepository(settingsRepository)
}
